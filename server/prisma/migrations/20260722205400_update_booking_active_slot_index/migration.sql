-- Hand-written: widen the partial unique index that guards against double
-- booking to also treat UNVERIFIED requests as slot-blocking (they're now a
-- soft-hold created before email confirmation). Not represented in
-- schema.prisma since Prisma's DSL has no WHERE-clause support for indexes.
-- Split into its own migration because Postgres disallows referencing an
-- enum value ('UNVERIFIED') added by ALTER TYPE within the same transaction
-- that added it.
DROP INDEX "BookingRequest_provider_slot_active_unique";

CREATE UNIQUE INDEX "BookingRequest_provider_slot_active_unique"
ON "BookingRequest" ("providerId", "startsAt")
WHERE "status" IN ('UNVERIFIED', 'PENDING', 'APPROVED');
