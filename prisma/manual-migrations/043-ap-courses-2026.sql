-- The APs actually being taken (owner, 2026-10-28): Statistics, Computer Science A, Biology,
-- Chemistry and Calculus BC.
--
-- Removes the courses that aren't taken — Physics C (both halves), World History and
-- Macroeconomics — with their units, and adds Biology, Chemistry and Calculus BC. Statistics and
-- Computer Science A stay exactly as 016 loaded them, ticks included.
--
-- Units and weightings follow each course's Course and Exam Description as known in 2026:
-- Biology's eight units, Chemistry's nine (the 2024 revision's titles for units 2 and 3) and
-- Calculus BC's ten. collegeboard.org is blocked from the environment that wrote this, so they were
-- not re-fetched — a correction is an edit here and a re-run.
--
-- DESTRUCTIVE for the removed courses only: their units' ticks are deleted.
--
-- Idempotent: re-running refreshes titles, weightings and order, and never touches `completedAt`.

BEGIN;

DELETE FROM "ApCourse" WHERE "id" IN ('apc_physc_mech', 'apc_physc_em', 'apc_world', 'apc_macro');

INSERT INTO "ApCourse" ("id", "name", "shortName", "series", "position", "createdAt", "updatedAt") VALUES
  ('apc_stats', 'AP Statistics', 'Statistics', NULL, 1, now(), now()),
  ('apc_csa', 'AP Computer Science A', 'CS A', NULL, 2, now(), now()),
  ('apc_bio', 'AP Biology', 'Biology', NULL, 3, now(), now()),
  ('apc_chem', 'AP Chemistry', 'Chemistry', NULL, 4, now(), now()),
  ('apc_calcbc', 'AP Calculus BC', 'Calculus BC', NULL, 5, now(), now())
ON CONFLICT ("id") DO UPDATE SET
  "name"      = EXCLUDED."name",
  "shortName" = EXCLUDED."shortName",
  "series"    = EXCLUDED."series",
  "position"  = EXCLUDED."position",
  "updatedAt" = now();

INSERT INTO "ApUnit" ("id", "courseId", "number", "title", "weighting", "createdAt", "updatedAt") VALUES
  ('apu_bio_1', 'apc_bio', 1, 'Chemistry of Life', '8%–11%', now(), now()),
  ('apu_bio_2', 'apc_bio', 2, 'Cell Structure and Function', '10%–13%', now(), now()),
  ('apu_bio_3', 'apc_bio', 3, 'Cellular Energetics', '12%–16%', now(), now()),
  ('apu_bio_4', 'apc_bio', 4, 'Cell Communication and Cell Cycle', '10%–15%', now(), now()),
  ('apu_bio_5', 'apc_bio', 5, 'Heredity', '8%–11%', now(), now()),
  ('apu_bio_6', 'apc_bio', 6, 'Gene Expression and Regulation', '12%–16%', now(), now()),
  ('apu_bio_7', 'apc_bio', 7, 'Natural Selection', '13%–20%', now(), now()),
  ('apu_bio_8', 'apc_bio', 8, 'Ecology', '10%–15%', now(), now()),
  ('apu_chem_1', 'apc_chem', 1, 'Atomic Structure and Properties', '7%–9%', now(), now()),
  ('apu_chem_2', 'apc_chem', 2, 'Compound Structure and Properties', '7%–9%', now(), now()),
  ('apu_chem_3', 'apc_chem', 3, 'Properties of Substances and Mixtures', '18%–22%', now(), now()),
  ('apu_chem_4', 'apc_chem', 4, 'Chemical Reactions', '7%–9%', now(), now()),
  ('apu_chem_5', 'apc_chem', 5, 'Kinetics', '7%–9%', now(), now()),
  ('apu_chem_6', 'apc_chem', 6, 'Thermochemistry', '7%–9%', now(), now()),
  ('apu_chem_7', 'apc_chem', 7, 'Equilibrium', '7%–9%', now(), now()),
  ('apu_chem_8', 'apc_chem', 8, 'Acids and Bases', '11%–15%', now(), now()),
  ('apu_chem_9', 'apc_chem', 9, 'Thermodynamics and Electrochemistry', '7%–9%', now(), now()),
  ('apu_calcbc_1', 'apc_calcbc', 1, 'Limits and Continuity', '4%–7%', now(), now()),
  ('apu_calcbc_2', 'apc_calcbc', 2, 'Differentiation: Definition and Fundamental Properties', '4%–7%', now(), now()),
  ('apu_calcbc_3', 'apc_calcbc', 3, 'Differentiation: Composite, Implicit, and Inverse Functions', '4%–7%', now(), now()),
  ('apu_calcbc_4', 'apc_calcbc', 4, 'Contextual Applications of Differentiation', '6%–9%', now(), now()),
  ('apu_calcbc_5', 'apc_calcbc', 5, 'Analytical Applications of Differentiation', '8%–11%', now(), now()),
  ('apu_calcbc_6', 'apc_calcbc', 6, 'Integration and Accumulation of Change', '17%–20%', now(), now()),
  ('apu_calcbc_7', 'apc_calcbc', 7, 'Differential Equations', '6%–9%', now(), now()),
  ('apu_calcbc_8', 'apc_calcbc', 8, 'Applications of Integration', '6%–9%', now(), now()),
  ('apu_calcbc_9', 'apc_calcbc', 9, 'Parametric Equations, Polar Coordinates, and Vector-Valued Functions', '11%–12%', now(), now()),
  ('apu_calcbc_10', 'apc_calcbc', 10, 'Infinite Sequences and Series', '17%–18%', now(), now())
-- Deliberately does NOT touch completedAt: re-running must never un-tick finished work.
ON CONFLICT ("id") DO UPDATE SET
  "title"     = EXCLUDED."title",
  "weighting" = EXCLUDED."weighting",
  "updatedAt" = now();

COMMIT;
