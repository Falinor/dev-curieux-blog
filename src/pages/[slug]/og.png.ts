import type { APIRoute, GetStaticPaths } from 'astro';
import { getPostsIn, type PostView } from '../../lib/posts';
import { postSocialImage } from '../../lib/social-image';

export const getStaticPaths = (async () => {
  const views = await getPostsIn('fr');
  return views.map((view) => ({ params: { slug: view.post.id }, props: { view } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute<{ view: PostView }> = ({ props }) => postSocialImage(props.view);
