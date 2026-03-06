import { Components } from "react-markdown";

export const markdownComponents: Components = {
  h1: ({ ...props }) => (
    <h1 className="text-2xl font-bold mt-4 mb-3" {...props} />
  ),
  h2: ({ ...props }) => (
    <h2 className="text-xl font-bold mt-4 mb-2" {...props} />
  ),
  h3: ({ ...props }) => (
    <h3 className="text-lg font-semibold mt-3 mb-2" {...props} />
  ),
  p: ({ ...props }) => <p className="my-2 leading-relaxed" {...props} />,
  ul: ({ ...props }) => (
    <ul className="my-2 list-disc pl-5 space-y-1" {...props} />
  ),
  ol: ({ ...props }) => (
    <ol className="my-2 list-decimal pl-5 space-y-1" {...props} />
  ),
  li: ({ ...props }) => <li className="my-1" {...props} />,
  strong: ({ ...props }) => <strong className="font-semibold" {...props} />,
  code: ({ ...props }) => (
    <code
      className="bg-muted/50 px-1.5 py-0.5 rounded text-sm font-mono"
      {...props}
    />
  ),
  pre: ({ ...props }) => (
    <pre
      className="bg-muted/50 p-3 rounded-lg overflow-x-auto my-2"
      {...props}
    />
  ),
  blockquote: ({ ...props }) => (
    <blockquote
      className="border-l-4 border-primary pl-4 italic my-2"
      {...props}
    />
  ),
  a: ({ ...props }) => (
    <a className="text-primary underline hover:opacity-80" {...props} />
  ),
};
