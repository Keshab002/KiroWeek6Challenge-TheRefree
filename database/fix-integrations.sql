-- Fix: Add all integrations to all options that are missing them
-- Run this if you get "One or both options do not support the required integrations" error

INSERT INTO option_integrations (option_id, integration_id, support_level)
SELECT o.id, i.id, 'native'
FROM options o
CROSS JOIN integrations i
WHERE NOT EXISTS (
  SELECT 1 FROM option_integrations oi 
  WHERE oi.option_id = o.id AND oi.integration_id = i.id
);

-- Verify: Show all option-integration mappings
SELECT o.name as option_name, i.name as integration_name, oi.support_level
FROM option_integrations oi
JOIN options o ON o.id = oi.option_id
JOIN integrations i ON i.id = oi.integration_id
ORDER BY o.name, i.name;
