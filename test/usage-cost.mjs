import assert from 'node:assert/strict';
import { calculateCostMicrousd, costBand, pointsForCost } from '../worker/index.js';

assert.equal(calculateCostMicrousd({ model: 'gpt-5.6-luna', inputTokens: 100000, outputTokens: 8000 }), 29600);
assert.equal(pointsForCost(29600), 1);
assert.equal(costBand(29600), 'normal');

assert.equal(calculateCostMicrousd({ model: 'gpt-5.6-luna', inputTokens: 300000, outputTokens: 30000 }), 174000);
assert.equal(pointsForCost(174000), 6);
assert.equal(costBand(174000), 'heavy');

assert.equal(calculateCostMicrousd({ model: 'gpt-5.6-luna', inputTokens: 922000, outputTokens: 128000 }), 599200);
assert.equal(costBand(599200), 'extreme');

assert.equal(calculateCostMicrousd({
  model: 'gpt-5.6-luna', inputTokens: 100000, cachedTokens: 50000, outputTokens: 8000, fileSearchCalls: 1,
}), 23100);

assert.equal(calculateCostMicrousd({ model: 'gpt-5.6-terra', inputTokens: 10000, outputTokens: 5000 }), 80000);
assert.equal(calculateCostMicrousd({ model: 'gpt-5.6-sol', inputTokens: 10000, outputTokens: 5000 }), 140000);

console.log('ScopeCut usage cost tests ✓');
