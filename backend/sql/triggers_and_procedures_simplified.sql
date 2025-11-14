-- Triggers, Functions and Stored Procedures (Simplified)
-- Purpose: Minimal set to implement auditing, payment archival, and useful summary routines.
-- This file targets MySQL/MariaDB. Install via mysql client:
--    mysql -u <user> -p <database> < backend/sql/triggers_and_procedures_simplified.sql

-- =====================================================================
-- 0) Drop existing objects (only those we will create) for idempotency
-- =====================================================================
DROP TRIGGER IF EXISTS trg_before_insert_service_request;
DROP TRIGGER IF EXISTS trg_after_update_service_request;
DROP TRIGGER IF EXISTS trg_after_delete_service_request;
DROP TRIGGER IF EXISTS trg_before_insert_payment;
DROP TRIGGER IF EXISTS trg_before_insert_grievance;

DROP PROCEDURE IF EXISTS sp_get_citizen_summary;
DROP PROCEDURE IF EXISTS sp_get_department_stats;
DROP PROCEDURE IF EXISTS sp_mark_grievance_resolved;

DROP FUNCTION IF EXISTS fn_total_paid_by_citizen;
DROP FUNCTION IF EXISTS fn_count_requests_by_citizen;
DROP FUNCTION IF EXISTS fn_avg_payment_by_service;
DROP FUNCTION IF EXISTS fn_open_grievances_by_department;
DROP FUNCTION IF EXISTS fn_is_citizen_active;

DROP TABLE IF EXISTS service_request_audit;
DROP TABLE IF EXISTS grievance_audit;
DROP TABLE IF EXISTS payment_archive;

-- =====================================================================
-- 1) Lightweight audit / archive tables
-- =====================================================================
CREATE TABLE IF NOT EXISTS service_request_audit (
    audit_id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    note TEXT
);

CREATE TABLE IF NOT EXISTS grievance_audit (
    audit_id INT AUTO_INCREMENT PRIMARY KEY,
    grievance_id INT NOT NULL,
    action VARCHAR(100),
    action_by VARCHAR(100),
    action_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    comment TEXT
);

CREATE TABLE IF NOT EXISTS payment_archive (
    payment_id INT PRIMARY KEY,
    original_amount DECIMAL(12,2),
    payment_method VARCHAR(50),
    payment_date DATETIME,
    status VARCHAR(50),
    archived_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =====================================================================
-- 2) Triggers (5 total)
--  - trg_before_insert_service_request: ensure Request_Date
--  - trg_after_update_service_request: audit status changes
--  - trg_after_delete_service_request: archive & remove linked payment
--  - trg_before_insert_payment: ensure Payment_Date
--  - trg_before_insert_grievance: ensure Grievance Date
-- =====================================================================
DELIMITER $$
CREATE TRIGGER trg_before_insert_service_request
BEFORE INSERT ON Service_Request
FOR EACH ROW
BEGIN
    IF NEW.Request_Date IS NULL THEN
        SET NEW.Request_Date = NOW();
    END IF;
END$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER trg_after_update_service_request
AFTER UPDATE ON Service_Request
FOR EACH ROW
BEGIN
    IF OLD.Status <> NEW.Status THEN
        INSERT INTO service_request_audit (request_id, old_status, new_status, changed_at)
        VALUES (NEW.Request_ID, OLD.Status, NEW.Status, NOW());
    END IF;
END$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER trg_after_delete_service_request
AFTER DELETE ON Service_Request
FOR EACH ROW
BEGIN
    -- Archive payment (if present) and then remove it from live table
    IF OLD.Payment_ID IS NOT NULL THEN
        INSERT INTO payment_archive (payment_id, original_amount, payment_method, payment_date, status)
        SELECT p.Payment_ID, p.Amount, p.Payment_Method, p.Payment_Date, p.Status
        FROM Payment p
        WHERE p.Payment_ID = OLD.Payment_ID
        ON DUPLICATE KEY UPDATE archived_at = NOW();

        DELETE FROM Payment WHERE Payment_ID = OLD.Payment_ID;
    END IF;
END$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER trg_before_insert_payment
BEFORE INSERT ON Payment
FOR EACH ROW
BEGIN
    IF NEW.Payment_Date IS NULL THEN
        SET NEW.Payment_Date = NOW();
    END IF;
END$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER trg_before_insert_grievance
BEFORE INSERT ON Grievance
FOR EACH ROW
BEGIN
    IF NEW.Date IS NULL THEN
        SET NEW.Date = NOW();
    END IF;
END$$
DELIMITER ;

-- =====================================================================
-- 3) Stored Procedures (3 total)
--  - sp_get_citizen_summary
--  - sp_get_department_stats
--  - sp_mark_grievance_resolved
-- =====================================================================
DELIMITER $$
CREATE PROCEDURE sp_get_citizen_summary(IN p_citizen_id INT)
BEGIN
    SELECT 
        c.Citizen_ID,
        c.Name,
        c.Email,
        COUNT(DISTINCT sr.Request_ID) AS Total_Service_Requests,
        COUNT(DISTINCT g.Grievance_ID) AS Total_Grievances,
        COALESCE(SUM(p.Amount), 0) AS Total_Amount_Paid,
        MAX(sr.Request_Date) AS Last_Service_Request_Date,
        MAX(g.Date) AS Last_Grievance_Date
    FROM Citizen c
    LEFT JOIN Service_Request sr ON c.Citizen_ID = sr.Citizen_ID
    LEFT JOIN Grievance g ON c.Citizen_ID = g.Citizen_ID
    LEFT JOIN Payment p ON sr.Payment_ID = p.Payment_ID AND p.Status = 'Completed'
    WHERE c.Citizen_ID = p_citizen_id
    GROUP BY c.Citizen_ID, c.Name, c.Email;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE sp_get_department_stats(IN p_department_id INT)
BEGIN
    SELECT 
        d.Department_ID,
        d.Department_Name,
        COUNT(DISTINCT s.Service_ID) AS Total_Services,
        COUNT(sr.Request_ID) AS Total_Requests,
        COUNT(CASE WHEN sr.Status = 'Completed' THEN 1 END) AS Completed_Requests,
        ROUND(COALESCE(SUM(p.Amount), 0), 2) AS Total_Revenue,
        ROUND(COALESCE(AVG(p.Amount), 0), 2) AS Avg_Payment
    FROM Department d
    LEFT JOIN Service s ON d.Department_ID = s.Department_ID
    LEFT JOIN Service_Request sr ON s.Service_ID = sr.Service_ID
    LEFT JOIN Payment p ON sr.Payment_ID = p.Payment_ID AND p.Status = 'Completed'
    WHERE d.Department_ID = p_department_id
    GROUP BY d.Department_ID, d.Department_Name;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE sp_mark_grievance_resolved(IN p_grievance_id INT, IN p_resolved_by VARCHAR(100))
BEGIN
    UPDATE Grievance SET Status = 'Resolved' WHERE Grievance_ID = p_grievance_id;
    INSERT INTO grievance_audit (grievance_id, action, action_by, action_at, comment)
    VALUES (p_grievance_id, 'Resolved', p_resolved_by, NOW(), NULL);
END$$
DELIMITER ;

-- =====================================================================
-- 4) Functions (5 total)
--  - fn_total_paid_by_citizen
--  - fn_count_requests_by_citizen
--  - fn_avg_payment_by_service
--  - fn_open_grievances_by_department
--  - fn_is_citizen_active
-- =====================================================================
DELIMITER $$
CREATE FUNCTION fn_total_paid_by_citizen(p_citizen_id INT) RETURNS DECIMAL(12,2)
DETERMINISTIC
BEGIN
    DECLARE total DECIMAL(12,2);
    SELECT COALESCE(SUM(p.Amount),0) INTO total
    FROM Payment p
    INNER JOIN Service_Request sr ON sr.Payment_ID = p.Payment_ID
    WHERE sr.Citizen_ID = p_citizen_id AND p.Status = 'Completed';
    RETURN total;
END$$
DELIMITER ;

DELIMITER $$
CREATE FUNCTION fn_count_requests_by_citizen(p_citizen_id INT) RETURNS INT
DETERMINISTIC
BEGIN
    DECLARE cnt INT;
    SELECT COUNT(*) INTO cnt FROM Service_Request WHERE Citizen_ID = p_citizen_id;
    RETURN IFNULL(cnt, 0);
END$$
DELIMITER ;

DELIMITER $$
CREATE FUNCTION fn_avg_payment_by_service(p_service_id INT) RETURNS DECIMAL(12,2)
DETERMINISTIC
BEGIN
    DECLARE avg_amt DECIMAL(12,2);
    SELECT COALESCE(AVG(p.Amount), 0) INTO avg_amt
    FROM Payment p
    INNER JOIN Service_Request sr ON sr.Payment_ID = p.Payment_ID
    WHERE sr.Service_ID = p_service_id AND p.Status = 'Completed';
    RETURN avg_amt;
END$$
DELIMITER ;

DELIMITER $$
CREATE FUNCTION fn_open_grievances_by_department(p_department_id INT) RETURNS INT
DETERMINISTIC
BEGIN
    DECLARE cnt INT;
    SELECT COUNT(*) INTO cnt
    FROM Grievance g
    WHERE g.Department_ID = p_department_id AND g.Status IN ('Open', 'Under Review');
    RETURN IFNULL(cnt, 0);
END$$
DELIMITER ;

DELIMITER $$
CREATE FUNCTION fn_is_citizen_active(p_citizen_id INT) RETURNS TINYINT(1)
DETERMINISTIC
BEGIN
    DECLARE last_date DATETIME;
    SELECT MAX(Request_Date) INTO last_date FROM Service_Request WHERE Citizen_ID = p_citizen_id;
    IF last_date IS NULL THEN
        RETURN 0;
    END IF;
    RETURN IF(DATEDIFF(CURDATE(), DATE(last_date)) <= 30, 1, 0);
END$$
DELIMITER ;

-- =====================================================================
-- Usage notes
--  - Install with mysql client to ensure DELIMITER blocks are handled correctly.
--  - The application should continue to issue normal DELETE/UPDATE/INSERT statements.
--    Triggers will perform archival and auditing in the DB.
-- =====================================================================
