-- Triggers, Functions and Stored Procedures (Simplified)
-- Purpose: Minimal set to implement auditing, payment archival, and useful summary routines.
-- This file targets MySQL/MariaDB. Install via mysql client:
--    mysql -u <user> -p <database> < backend/sql/triggers_and_procedures.sql

-- =====================================================================
-- 0) Drop existing objects (only those we will create) for idempotency
-- =====================================================================
DROP TRIGGER IF EXISTS trg_before_insert_service_request;
DROP TRIGGER IF EXISTS trg_after_update_service_request;
DROP TRIGGER IF EXISTS trg_after_delete_service_request;
DROP TRIGGER IF EXISTS trg_before_insert_payment;

DROP PROCEDURE IF EXISTS sp_get_citizen_summary;
DROP PROCEDURE IF EXISTS sp_get_department_stats;
DROP PROCEDURE IF EXISTS sp_mark_grievance_resolved;
        -- Delete the payment
        DELETE FROM Payment WHERE Payment_ID = OLD.Payment_ID;
    END IF;
END$$
DELIMITER ;

-- 2.7 AFTER DELETE ON Service: delete related service_requests (which will cascade to payments via trg_after_delete_service_request)
DELIMITER $$
CREATE TRIGGER trg_after_delete_service
AFTER DELETE ON Service
FOR EACH ROW
BEGIN
    DELETE FROM Service_Request WHERE Service_ID = OLD.Service_ID;
END$$
DELIMITER ;

-- 2.8 AFTER DELETE ON Citizen: delete related service requests and grievances (payments handled by trg_after_delete_service_request)
DELIMITER $$
CREATE TRIGGER trg_after_delete_citizen
AFTER DELETE ON Citizen
FOR EACH ROW
BEGIN
    -- Delete service requests (will cause trg_after_delete_service_request to archive/delete payments)
    DELETE FROM Service_Request WHERE Citizen_ID = OLD.Citizen_ID;

    -- Delete grievances
    DELETE FROM Grievance WHERE Citizen_ID = OLD.Citizen_ID;
END$$
DELIMITER ;

-- =====================================================================
-- 3) Stored procedures
-- =====================================================================
-- 3.1 Procedure: get citizen summary (returns totals and last dates)
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

-- Call example: CALL sp_get_citizen_summary(123);

-- 3.2 Procedure: department stats (returns aggregated numbers)
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

-- Call example: CALL sp_get_department_stats(10);

-- 3.3 Procedure: archive old completed payments (moves to payment_archive)
DELIMITER $$
CREATE PROCEDURE sp_archive_old_payments(IN p_cutoff_date DATE)
BEGIN
    -- Insert into archive
    INSERT INTO payment_archive (payment_id, original_amount, payment_method, payment_date, status)
    SELECT Payment_ID, Amount, Payment_Method, Payment_Date, Status
    FROM Payment
    WHERE Status = 'Completed' AND Payment_Date < p_cutoff_date
    ON DUPLICATE KEY UPDATE archived_at = NOW();

    -- Optionally delete from live payments (commented out by default)
    -- DELETE FROM Payment WHERE Status = 'Completed' AND Payment_Date < p_cutoff_date;
END$$
DELIMITER ;

-- Call example: CALL sp_archive_old_payments('2024-01-01');

-- =====================================================================
-- 3.4 Procedure: delete citizen and all related records (service requests, payments, grievances)
DELIMITER $$
CREATE PROCEDURE sp_delete_citizen_and_related(IN p_citizen_id INT)
BEGIN
    DECLARE done INT DEFAULT 0;
    DECLARE pid INT;

    -- Archive and delete payments linked to the citizen's service requests
    -- First collect payments for archiving
    INSERT INTO payment_archive (payment_id, original_amount, payment_method, payment_date, status)
    SELECT p.Payment_ID, p.Amount, p.Payment_Method, p.Payment_Date, p.Status
    FROM Payment p
    INNER JOIN Service_Request sr ON sr.Payment_ID = p.Payment_ID
    WHERE sr.Citizen_ID = p_citizen_id
    ON DUPLICATE KEY UPDATE archived_at = NOW();

    -- Delete payments linked to citizen's requests
    DELETE p FROM Payment p
    INNER JOIN Service_Request sr2 ON sr2.Payment_ID = p.Payment_ID
    WHERE sr2.Citizen_ID = p_citizen_id;

    -- Delete service requests
    DELETE FROM Service_Request WHERE Citizen_ID = p_citizen_id;

    -- Delete grievances
    DELETE FROM Grievance WHERE Citizen_ID = p_citizen_id;

    -- Finally delete the citizen
    DELETE FROM Citizen WHERE Citizen_ID = p_citizen_id;
END$$
DELIMITER ;

-- 3.5 Procedure: delete a service and all related service requests and payments
DELIMITER $$
CREATE PROCEDURE sp_delete_service_and_related(IN p_service_id INT)
BEGIN
    -- Archive payments for requests under this service
    INSERT INTO payment_archive (payment_id, original_amount, payment_method, payment_date, status)
    SELECT p.Payment_ID, p.Amount, p.Payment_Method, p.Payment_Date, p.Status
    FROM Payment p
    INNER JOIN Service_Request sr ON sr.Payment_ID = p.Payment_ID
    WHERE sr.Service_ID = p_service_id
    ON DUPLICATE KEY UPDATE archived_at = NOW();

    -- Delete payments
    DELETE p FROM Payment p
    INNER JOIN Service_Request sr2 ON sr2.Payment_ID = p.Payment_ID
    WHERE sr2.Service_ID = p_service_id;

    -- Delete service requests
    DELETE FROM Service_Request WHERE Service_ID = p_service_id;

    -- Delete the service
    DELETE FROM Service WHERE Service_ID = p_service_id;
END$$
DELIMITER ;

-- 3.6 Procedure: delete a single service request and its payment
DELIMITER $$
CREATE PROCEDURE sp_delete_service_request_and_related(IN p_request_id INT)
BEGIN
    -- Archive payment if exists
    INSERT INTO payment_archive (payment_id, original_amount, payment_method, payment_date, status)
    SELECT p.Payment_ID, p.Amount, p.Payment_Method, p.Payment_Date, p.Status
    FROM Payment p
    WHERE p.Payment_ID = (SELECT Payment_ID FROM Service_Request WHERE Request_ID = p_request_id)
    ON DUPLICATE KEY UPDATE archived_at = NOW();

    -- Delete payment
    DELETE p FROM Payment p
    WHERE p.Payment_ID = (SELECT Payment_ID FROM Service_Request WHERE Request_ID = p_request_id);

    -- Delete the request
    DELETE FROM Service_Request WHERE Request_ID = p_request_id;
END$$
DELIMITER ;

-- 3.7 Procedure: delete department and all related services (and their requests/payments)
DELIMITER $$
CREATE PROCEDURE sp_delete_department_and_related(IN p_department_id INT)
BEGIN
    DECLARE done INT DEFAULT 0;
    DECLARE sid INT;
    DECLARE cur_services CURSOR FOR SELECT Service_ID FROM Service WHERE Department_ID = p_department_id;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

    OPEN cur_services;
    read_loop: LOOP
        FETCH cur_services INTO sid;
        IF done THEN
            LEAVE read_loop;
        END IF;
        -- call delete service proc for each service
        CALL sp_delete_service_and_related(sid);
    END LOOP;
    CLOSE cur_services;

    -- Delete any remaining services (should be none) and department
    DELETE FROM Service WHERE Department_ID = p_department_id;
    DELETE FROM Department WHERE Department_ID = p_department_id;
END$$
DELIMITER ;

-- 3.8 Function: total paid by citizen
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

-- =====================================================================
-- Additional Functions (4)
-- =====================================================================
DROP FUNCTION IF EXISTS fn_count_requests_by_citizen;
DELIMITER $$
CREATE FUNCTION fn_count_requests_by_citizen(p_citizen_id INT) RETURNS INT
DETERMINISTIC
BEGIN
    DECLARE cnt INT;
    SELECT COUNT(*) INTO cnt FROM Service_Request WHERE Citizen_ID = p_citizen_id;
    RETURN IFNULL(cnt, 0);
END$$
DELIMITER ;

DROP FUNCTION IF EXISTS fn_avg_payment_by_service;
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

DROP FUNCTION IF EXISTS fn_open_grievances_by_department;
DELIMITER $$
CREATE FUNCTION fn_open_grievances_by_department(p_department_id INT) RETURNS INT
DETERMINISTIC
BEGIN
    DECLARE cnt INT;
    SELECT COUNT(*) INTO cnt
    FROM Grievance g
    INNER JOIN Department d ON g.Department_ID = d.Department_ID
    WHERE d.Department_ID = p_department_id AND g.Status IN ('Open', 'Under Review');
    RETURN IFNULL(cnt, 0);
END$$
DELIMITER ;

DROP FUNCTION IF EXISTS fn_is_citizen_active;
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
-- Additional Stored Procedures (3)
-- =====================================================================
DROP PROCEDURE IF EXISTS sp_mark_grievance_resolved;
DELIMITER $$
CREATE PROCEDURE sp_mark_grievance_resolved(IN p_grievance_id INT, IN p_resolved_by VARCHAR(100))
BEGIN
    UPDATE Grievance SET Status = 'Resolved' WHERE Grievance_ID = p_grievance_id;
    INSERT INTO grievance_audit (grievance_id, action, action_by, action_at, comment)
    VALUES (p_grievance_id, 'Resolved', p_resolved_by, NOW(), NULL);
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_transfer_service_to_department;
DELIMITER $$
CREATE PROCEDURE sp_transfer_service_to_department(IN p_service_id INT, IN p_new_dept INT)
BEGIN
    DECLARE old_dept INT;
    SELECT Department_ID INTO old_dept FROM Service WHERE Service_ID = p_service_id;
    UPDATE Service SET Department_ID = p_new_dept WHERE Service_ID = p_service_id;
    INSERT INTO service_audit (service_id, old_department_id, new_department_id, action, action_at)
    VALUES (p_service_id, old_dept, p_new_dept, 'Transferred', NOW());
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_cleanup_orphan_payments;
DELIMITER $$
CREATE PROCEDURE sp_cleanup_orphan_payments()
BEGIN
    -- Move orphan payments (not referenced by any service_request) to archive
    INSERT INTO payment_archive (payment_id, original_amount, payment_method, payment_date, status)
    SELECT p.Payment_ID, p.Amount, p.Payment_Method, p.Payment_Date, p.Status
    FROM Payment p
    LEFT JOIN Service_Request sr ON sr.Payment_ID = p.Payment_ID
    WHERE sr.Payment_ID IS NULL
    ON DUPLICATE KEY UPDATE archived_at = NOW();

    -- Optionally delete them from Payment table (commented out)
    -- DELETE p FROM Payment p LEFT JOIN Service_Request sr2 ON sr2.Payment_ID = p.Payment_ID WHERE sr2.Payment_ID IS NULL;
END$$
DELIMITER ;

-- =====================================================================
-- 4) Notes & usage
-- =====================================================================
-- To install these triggers/procedures using the mysql CLI:
--    mysql -u <user> -p <database> < backend/sql/triggers_and_procedures.sql
--
-- To call procedures from mysql client:
--    CALL sp_get_citizen_summary(1);
--    CALL sp_get_department_stats(2);
--    CALL sp_archive_old_payments('2024-01-01');
--
-- To create triggers/ procs from Python (SQLAlchemy engine):
--    from sqlalchemy import text
--    sql = open('backend/sql/triggers_and_procedures.sql').read()
--    with engine.begin() as conn:
--        for stmt in sql.split('DELIMITER ;'):
--            s = stmt.strip()
--            if s:
--                conn.execute(text(s))
--
-- (Note: SQLAlchemy may not like the DELIMITER tokens; prefer running the file via the mysql client or using raw connection.cursor().execute() in pymysql/Connector.)

-- =====================================================================
-- End of file
-- =====================================================================
