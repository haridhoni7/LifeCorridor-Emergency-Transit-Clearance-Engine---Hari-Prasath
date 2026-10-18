import test from 'node:test';
import assert from 'node:assert/strict';
import { CITY_PRESETS, generateCustomCorridor, generatePointToPointCorridor } from './cityRoutes.ts';

test('CITY_PRESETS contains valid presets for major Asian megacities', () => {
  assert.ok(CITY_PRESETS.length >= 3);
  const blr = CITY_PRESETS.find((c) => c.id === 'bengaluru');
  assert.ok(blr);
  assert.ok(blr.route.length >= 5);
  assert.equal(typeof blr.hospital, 'string');
});

test('generateCustomCorridor creates valid multi-point corridor from custom origin', () => {
  const corridor = generateCustomCorridor(12.9719, 77.6412, 'Indiranagar 100ft Road');
  assert.ok(corridor);
  assert.ok(corridor.route.length >= 6);
  assert.equal(corridor.route[0].lat, 12.9719);
  assert.equal(corridor.route[0].lng, 77.6412);
  assert.ok(corridor.detourRoute && corridor.detourRoute.length > 0);
});

test('generatePointToPointCorridor generates realistic waypoints between any two coordinates', () => {
  const p2p = generatePointToPointCorridor(
    12.9716,
    77.5946,
    'MG Road Metro, Bengaluru',
    12.9352,
    77.6245,
    'Koramangala Trauma Unit, Bengaluru'
  );

  assert.ok(p2p);
  assert.ok(p2p.route.length >= 7);
  assert.equal(p2p.route[0].name.includes('MG Road Metro'), true);
  assert.equal(p2p.route[p2p.route.length - 1].name.includes('Koramangala Trauma Unit'), true);
  assert.ok(p2p.detourRoute && p2p.detourRoute.length > 0);
});
