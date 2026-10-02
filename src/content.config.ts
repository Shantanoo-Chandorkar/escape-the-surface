import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Content Collection schema for all topic MDX files.
 *
 * Frontmatter fields are validated at build time. Any MDX file in
 * src/content/topics/ that violates this schema will cause a build error,
 * which is the primary safety net the plan described.
 */
const topics = defineCollection({
    loader: glob({ pattern: '**/*.mdx', base: './src/content/topics' }),
    schema: z.object({
        title: z.string(),
        category: z.string(),
        subcategory: z.string().optional(),
        /** Numeric order for sorting within a category - matches the id from the legacy topics.json. */
        order: z.number().optional(),
        description: z.string().optional(),
        /** Hides the topic from category listings; the page itself is still built and publicly reachable. */
        isUnlisted: z.boolean().optional(),
    }),
});

export const collections = { topics };
