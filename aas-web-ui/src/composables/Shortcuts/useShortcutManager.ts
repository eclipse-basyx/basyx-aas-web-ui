import { ref } from 'vue';

export type Scope = 'global' | 'commander' | 'editor' | string;
export type HandlerResult = boolean; // true = handled
export type ShortcutHandler = (e: KeyboardEvent) => HandlerResult;

export type RegisterOptions = {
    /**
     * If true, handler can run even when the user is typing in input/textarea/contenteditable.
     * Default: false
     */
    allowInInputs?: boolean;
};

type RegisteredHandler = {
    fn: ShortcutHandler;
    allowInInputs: boolean;
};

const activeScope = ref<Scope>('global');
const handlers = new Map<Scope, Set<RegisteredHandler>>();
let installed = false;

function isTypingTarget(target: EventTarget | null): boolean {
    const el = target as HTMLElement | null;
    if (!el) return false;

    const tag = el.tagName?.toLowerCase();
    return tag === 'input' || tag === 'textarea' || (el as any).isContentEditable === true;
}

function dispatch(e: KeyboardEvent): void {
    const typing = isTypingTarget(e.target);

    const runHandlers = (scope: Scope): boolean => {
        const set = handlers.get(scope);
        if (!set) return false;

        for (const h of set) {
            if (typing && !h.allowInInputs) continue;
            if (h.fn(e)) return true;
        }
        return false;
    };

    // scope first, then global
    if (runHandlers(activeScope.value)) return;
    runHandlers('global');
}

function ensureInstalled(): void {
    if (installed) return;
    installed = true;
    window.addEventListener('keydown', dispatch, { capture: true });
}

export function useShortcutManager() {
    ensureInstalled();

    function register(scope: Scope, fn: ShortcutHandler, options: RegisterOptions = {}): () => void {
        const entry: RegisteredHandler = {
            fn,
            allowInInputs: options.allowInInputs ?? false,
        };

        if (!handlers.has(scope)) handlers.set(scope, new Set());
        handlers.get(scope)!.add(entry);

        return () => {
            handlers.get(scope)?.delete(entry);
        };
    }

    function setScope(scope: Scope): void {
        activeScope.value = scope;
    }

    return {
        register,
        setScope,
        activeScope,
        // exporting isTypingTarget is optional; manager already applies it globally
    };
}
