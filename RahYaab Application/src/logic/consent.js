// FR-1.4: individual students under 18 (or with unknown age) also need a parent/guardian's agreement.
// School students are covered by their school's consent (they still agree themselves).
export const needsGuardian = (u) => !u.org && (u.age == null || u.age < 18);
