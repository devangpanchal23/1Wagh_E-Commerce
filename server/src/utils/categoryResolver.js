const mongoose = require('mongoose');

/**
 * Resolves a category input (ObjectId, string ID, slug, or name) to a valid Category ObjectId.
 * Fallbacks to the first existing Category in database if input is empty/invalid.
 * Creates a default 'General' Category if database has zero categories.
 */
async function resolveCategoryId(categoryInput) {
  const Category = mongoose.model('Category');

  let target = categoryInput;
  if (target && typeof target === 'object' && target._id) {
    target = target._id;
  }

  if (target && (typeof target === 'string' || target instanceof mongoose.Types.ObjectId)) {
    const targetStr = target.toString().trim();

    if (targetStr.match(/^[0-9a-fA-F]{24}$/)) {
      const existingById = await Category.findById(targetStr);
      if (existingById) {
        return existingById._id;
      }
    }

    if (targetStr.length > 0) {
      const existingBySlugOrName = await Category.findOne({
        $or: [
          { slug: targetStr.toLowerCase() },
          { name: new RegExp(`^${targetStr.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, 'i') }
        ]
      });
      if (existingBySlugOrName) {
        return existingBySlugOrName._id;
      }
    }
  }

  // Fallback 1: Return the first available Category in DB
  const firstCategory = await Category.findOne();
  if (firstCategory) {
    return firstCategory._id;
  }

  // Fallback 2: Auto-create a default 'General' Category if DB is completely empty
  const defaultCategory = await Category.create({
    name: 'General',
    slug: 'general',
    description: 'General product category',
    icon: 'Package'
  });
  return defaultCategory._id;
}

module.exports = { resolveCategoryId };
