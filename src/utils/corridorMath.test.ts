import test from 'node:test';
import assert from 'node:assert/strict';
import {
  haversineDistance,
  calculateBearing,
  isDirectionalMatch,
  evaluate3ZoneShockwave,
} from './corridorMath.ts';

test('haversineDistance calculates accurate urban distance', () => {
  // Coordinates along Old Airport Road, Bengaluru: Domlur to Manipal Hospital (~3.1 km)
  const domlur = { lat: 12.9592, lng: 77.6444 };
  const manipal = { lat: 12.9562, lng: 77.672 };
  const dist = haversineDistance(domlur.lat, domlur.lng, manipal.lat, manipal.lng);
  
  // Expected distance is ~3000m (around 3010m)
  assert.ok(dist > 2800 && dist < 3200, `Distance should be ~3000m, got ${dist}`);
});

test('calculateBearing returns reasonable heading', () => {
  // Moving East from Domlur to Manipal Hospital
  const bearing = calculateBearing(12.9592, 77.6444, 12.9562, 77.672);
  // Bearing East-South-East should be around 95-100 degrees
  assert.ok(bearing >= 80 && bearing <= 110, `Bearing should be ~95°, got ${bearing}`);
});

test('isDirectionalMatch filters opposing lanes and cross-traffic', () => {
  // Same heading (East 95° vs East 100°) -> MATCH
  assert.equal(isDirectionalMatch(95, 100, 35), true);

  // Opposing traffic (East 95° vs West 275°) -> NO MATCH
  assert.equal(isDirectionalMatch(95, 275, 35), false);

  // Perpendicular cross-street (95° vs 185°) -> NO MATCH
  assert.equal(isDirectionalMatch(95, 185, 35), false);

  // Near 0° / 360° boundary (355° vs 10°) -> MATCH
  assert.equal(isDirectionalMatch(355, 10, 35), true);
});

test('evaluate3ZoneShockwave assigns correct zones and directives', () => {
  // Zone 1: Contact (0-500m)
  const z1 = evaluate3ZoneShockwave(350, 95, 95, 10);
  assert.equal(z1.zone, 'ZONE_1_CONTACT');
  assert.equal(z1.directive, 'MERGE_LEFT_NOW');
  assert.equal(z1.colorCode, 'RED');
  assert.equal(z1.elasticBufferMeters, 2.0);

  // Zone 2: Elastic Cushion (500m-3000m)
  const z2 = evaluate3ZoneShockwave(1400, 95, 95, 10);
  assert.equal(z2.zone, 'ZONE_2_ELASTIC_CUSHION');
  assert.equal(z2.directive, 'MAINTAIN_2M_GAP');
  assert.equal(z2.colorCode, 'AMBER');

  // Zone 3: Bottleneck Flushing (3000m-10000m)
  const z3 = evaluate3ZoneShockwave(4500, 95, 95, 10);
  assert.equal(z3.zone, 'ZONE_3_CHOKEPOINT_FLUSH');
  assert.equal(z3.directive, 'FLUSH_FORWARD');
  assert.equal(z3.colorCode, 'YELLOW');

  // Zone Clear (>10000m)
  const zClear = evaluate3ZoneShockwave(12000, 95, 95, 45);
  assert.equal(zClear.zone, 'ZONE_CLEAR');
  assert.equal(zClear.directive, 'NORMAL_NAVIGATION');
  assert.equal(zClear.colorCode, 'GREEN');

  // Opposing lane should not trigger emergency alert
  const zOpposing = evaluate3ZoneShockwave(300, 95, 275, 10);
  assert.equal(zOpposing.zone, 'ZONE_CLEAR');
  assert.equal(zOpposing.isDirectionalMatch, false);

  // Right lane zipper merge (Lane 3) triggers MERGE_RIGHT_NOW
  const zRight = evaluate3ZoneShockwave(300, 95, 95, 10, 'LANE_3_RIGHT');
  assert.equal(zRight.zone, 'ZONE_1_CONTACT');
  assert.equal(zRight.directive, 'MERGE_RIGHT_NOW');
});
