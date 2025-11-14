-- Create views used by the frontend DB Tools demo
-- Run this file in your MySQL client (mysql CLI or Workbench). DELIMITER is not required for simple views.

CREATE OR REPLACE VIEW view_total_paid_per_citizen AS
SELECT
  c.Citizen_ID,
  c.Name,
  COALESCE(SUM(p.Amount), 0) AS Total_Paid
FROM Citizen c
LEFT JOIN Service_Request sr ON sr.Citizen_ID = c.Citizen_ID
LEFT JOIN Payment p ON p.Payment_ID = sr.Payment_ID
GROUP BY c.Citizen_ID, c.Name;

CREATE OR REPLACE VIEW view_request_counts_per_service AS
SELECT
  s.Service_ID,
  s.Service_Name,
  COUNT(sr.Request_ID) AS Request_Count
FROM Service s
LEFT JOIN Service_Request sr ON sr.Service_ID = s.Service_ID
GROUP BY s.Service_ID, s.Service_Name;

CREATE OR REPLACE VIEW view_open_grievances_per_department AS
SELECT
  d.Department_ID,
  d.Department_Name,
  COUNT(g.Grievance_ID) AS Open_Count
FROM Department d
LEFT JOIN Grievance g ON g.Department_ID = d.Department_ID
  AND (g.Status IS NULL OR g.Status <> 'Resolved')
GROUP BY d.Department_ID, d.Department_Name;

-- Optional: a simple recent requests view (most recent 20)
CREATE OR REPLACE VIEW view_recent_requests AS
SELECT
  sr.Request_ID,
  sr.Citizen_ID,
  c.Name AS Citizen_Name,
  sr.Service_ID,
  s.Service_Name,
  sr.Request_Date,
  sr.Status,
  sr.Payment_ID
FROM Service_Request sr
LEFT JOIN Citizen c ON c.Citizen_ID = sr.Citizen_ID
LEFT JOIN Service s ON s.Service_ID = sr.Service_ID
ORDER BY sr.Request_Date DESC, sr.Request_ID DESC
LIMIT 100;

-- Rollback: to remove these views, run:
-- DROP VIEW IF EXISTS view_total_paid_per_citizen, view_request_counts_per_service, view_open_grievances_per_department, view_recent_requests;
