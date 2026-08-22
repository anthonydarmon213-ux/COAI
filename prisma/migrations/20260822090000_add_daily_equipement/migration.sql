-- Matériel réellement disponible le jour du check-in (22/08/2026, demande
-- Anthony : "il faut proposer à la personne lors du check-in du jour le
-- matériel à disposition, ça peut évoluer"). Distinct de
-- Profile.equipementDisponible, qui reste le matériel habituel : cette
-- colonne ne vaut que pour CE jour-là. NULL = non renseigné, la séance
-- utilise alors l'équipement du profil comme avant.
ALTER TABLE "daily_sessions" ADD COLUMN "equipementDuJour" TEXT;
