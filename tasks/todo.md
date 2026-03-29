# Diggr TODO

## Plan

- [x] Let drilling proceed even when cargo is full.
- [x] Discard mined ore at resolution time when cargo capacity is exceeded.
- [x] Add regression coverage and rerun verification.

## Review

- Mining now treats cargo capacity as a collection constraint instead of a drill-start constraint, which matches the intended loop: the block still gets destroyed, but the ore is dropped if the hold is full.
