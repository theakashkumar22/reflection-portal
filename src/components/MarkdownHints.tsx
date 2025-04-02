
import React from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

const markdownHints = [
  { syntax: "# Heading", description: "Create a heading" },
  { syntax: "## Subheading", description: "Create a subheading" },
  { syntax: "**bold**", description: "Make text bold" },
  { syntax: "*italic*", description: "Make text italic" },
  { syntax: "[link](url)", description: "Create a link" },
  { syntax: "- item", description: "Create a list item" },
  { syntax: "1. item", description: "Create a numbered list" },
  { syntax: "> quote", description: "Create a blockquote" },
  { syntax: "```code```", description: "Create a code block" },
  { syntax: "--- ", description: "Create a horizontal rule" },
];

export const getMarkdownPlaceholder = (): string => {
  return `# Your Note Title

## Getting Started
- Use **markdown** to *format* your notes
- Create lists, links, and more
- Use \`code\` for inline code

> Remember to save your thoughts!

---
Need help with markdown? Click the "Markdown Tips" button below the editor.
`;
};

export const MarkdownHints: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Collapsible 
      open={isOpen} 
      onOpenChange={setIsOpen}
      className="w-full border rounded-md bg-background/50 backdrop-blur-sm shadow-sm"
    >
      <div className="flex items-center justify-between px-4 py-2">
        <h4 className="text-sm font-medium">Markdown Tips</h4>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="p-0 h-7 w-7">
            <ChevronDown 
              className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "transform rotate-180" : ""}`} 
            />
            <span className="sr-only">Toggle markdown tips</span>
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent>
        <div className="px-4 pb-3 pt-0">
          <div className="text-xs text-muted-foreground">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {markdownHints.map((hint, index) => (
                <div key={index} className="flex items-center gap-2">
                  <code className="bg-muted px-1 py-0.5 rounded text-xs">{hint.syntax}</code>
                  <span className="text-xs">{hint.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
