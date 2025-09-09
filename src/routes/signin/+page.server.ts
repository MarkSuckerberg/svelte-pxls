import { signIn } from "../../hooks.server";
import type { Actions } from './$types';
export const actions: Actions = { default: signIn };
