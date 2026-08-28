const mongoose = require('mongoose');

/**
 * Resolves a parentId input (ObjectId, string ID, empty/'none') to either a valid
 * Product ObjectId or null (top-level). Rejects self-parenting and, when updating
 * an existing product, rejects setting the parent to one of that product's own
 * descendants (which would create a cycle in the hierarchy).
 */
async function resolveParentId(rawParentId, currentProductId) {
  const Product = mongoose.model('Product');

  if (!rawParentId) return null;
  const targetStr = String(rawParentId).trim();
  if (!targetStr || targetStr.toLowerCase() === 'none' || targetStr.toLowerCase() === 'null') {
    return null;
  }

  if (!targetStr.match(/^[0-9a-fA-F]{24}$/)) {
    throw new Error('Invalid parent product reference.');
  }

  if (currentProductId && targetStr === String(currentProductId)) {
    throw new Error('A product cannot be its own parent.');
  }

  const parent = await Product.findById(targetStr).select('_id parentId').lean();
  if (!parent) {
    throw new Error('Selected parent product does not exist.');
  }

  if (currentProductId) {
    // Walk up the candidate parent's ancestor chain — if the product being
    // updated shows up in it, assigning this parent would create a cycle.
    let cursor = parent;
    const seen = new Set();
    while (cursor && cursor.parentId) {
      const cursorParentStr = String(cursor.parentId);
      if (cursorParentStr === String(currentProductId)) {
        throw new Error('Cannot set parent: this would create a circular product hierarchy.');
      }
      if (seen.has(cursorParentStr)) break; // guard against pre-existing corrupt cycles
      seen.add(cursorParentStr);
      cursor = await Product.findById(cursor.parentId).select('_id parentId').lean();
    }
  }

  return targetStr;
}

/**
 * Returns every descendant id (any depth) of the given product id via a
 * breadth-first walk of the parentId chain.
 */
async function getDescendantIds(rootId) {
  const Product = mongoose.model('Product');

  const descendantIds = [];
  let currentLevel = [rootId];

  while (currentLevel.length > 0) {
    const children = await Product.find({ parentId: { $in: currentLevel } })
      .select('_id')
      .lean();
    if (children.length === 0) break;
    const childIds = children.map((c) => c._id);
    descendantIds.push(...childIds);
    currentLevel = childIds;
  }

  return descendantIds;
}

module.exports = { resolveParentId, getDescendantIds };
