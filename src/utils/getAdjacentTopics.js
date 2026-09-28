import topics from '../data/topics.json';
import categoryMeta from '../data/categoryMeta';
import { formatTitle } from './formatTitle';

/**
 * Builds the display fields a pager link needs from a topics.json entry.
 *
 * @param {object} topic - Entry from topics.json.
 * @returns {{slug: string, title: string, categoryLabel: string, subcategoryLabel: string}} Pager link fields.
 */
const toPagerTopic = (topic) => ({
  slug: topic.slug,
  title: topic.title,
  categoryLabel: categoryMeta[topic.category]?.name ?? formatTitle(topic.category),
  subcategoryLabel: formatTitle(topic.subcategory),
});

/**
 * Finds the topics before and after a slug in reading order (topics.json array order, same as the sidebar).
 * Uses array position, not id, because ids have gaps.
 *
 * @param {string} slug - Slug of the topic being viewed.
 * @returns {{previous: object|null, next: object|null}} Neighbour link fields, null at either end or for an unknown slug.
 */
export const getAdjacentTopics = (slug) => {
  const currentIndex = topics.findIndex((topic) => topic.slug === slug);
  if (currentIndex === -1) return { previous: null, next: null };

  const previousTopic = topics[currentIndex - 1];
  const nextTopic = topics[currentIndex + 1];

  return {
    previous: previousTopic ? toPagerTopic(previousTopic) : null,
    next: nextTopic ? toPagerTopic(nextTopic) : null,
  };
};

export default getAdjacentTopics;
