import { describe, it, expect } from 'vitest';
import topics from '../data/topics.json';
import categoryMeta from '../data/categoryMeta';
import { formatTitle } from './formatTitle';
import { getAdjacentTopics } from './getAdjacentTopics';

describe('getAdjacentTopics', () => {
    it('has no previous topic for the first topic', () => {
        const { previous, next } = getAdjacentTopics(topics[0].slug);

        expect(previous).toBeNull();
        expect(next.slug).toBe(topics[1].slug);
    });

    it('has no next topic for the last topic', () => {
        const lastTopic = topics[topics.length - 1];
        const { previous, next } = getAdjacentTopics(lastTopic.slug);

        expect(next).toBeNull();
        expect(previous.slug).toBe(topics[topics.length - 2].slug);
    });

    it('follows array position across a gap in ids (72 to 74)', () => {
        const { previous, next } = getAdjacentTopics('react-memo-use-callback');

        expect(previous.slug).toBe(topics[topics.findIndex((t) => t.id === 72) - 1].slug);
        expect(next.slug).toBe('usememo-expensive-computation-caching');
    });

    it('carries the other category label when the neighbour is in a different category', () => {
        const firstReactIndex = topics.findIndex((topic) => topic.category === 'react');
        const firstReactTopic = topics[firstReactIndex];
        const lastJavascriptTopic = topics[firstReactIndex - 1];

        const { previous } = getAdjacentTopics(firstReactTopic.slug);

        expect(previous.slug).toBe(lastJavascriptTopic.slug);
        expect(previous.categoryLabel).toBe('JavaScript');
    });

    it('builds labels the same way the sidebar does', () => {
        const { next } = getAdjacentTopics(topics[0].slug);
        const nextTopic = topics[1];

        expect(next.title).toBe(nextTopic.title);
        expect(next.categoryLabel).toBe(categoryMeta[nextTopic.category].name);
        expect(next.subcategoryLabel).toBe(formatTitle(nextTopic.subcategory));
    });

    it('returns null on both sides for a slug that is not in topics.json', () => {
        expect(getAdjacentTopics('what-is-a-pwa')).toEqual({ previous: null, next: null });
    });
});
