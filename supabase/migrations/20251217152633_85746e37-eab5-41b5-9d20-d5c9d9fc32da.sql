-- Reativar o status "1ª Tentativa" que foi desativado acidentalmente
UPDATE lead_statuses 
SET active = true 
WHERE id = '068f1278-a9fa-4cfb-a229-1bd22d1e0f95';