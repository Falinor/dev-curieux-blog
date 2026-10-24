import type { APIRoute } from 'astro';
import { homeSocialImage } from '../lib/social-image';

export const GET: APIRoute = () => homeSocialImage('fr');
