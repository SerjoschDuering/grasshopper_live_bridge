"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promptDefinitions = void 0;
exports.promptDefinitions = [
    // Hello World Prompts for Testing
    {
        name: 'explain-extension',
        description: 'Explain what the GH Bridge extension does',
        arguments: [
            {
                name: 'detail_level',
                description: 'Level of detail (brief/detailed)',
                required: false
            }
        ]
    },
    {
        name: 'suggest-workflow',
        description: 'Suggest a Grasshopper workflow based on requirements',
        arguments: [
            {
                name: 'task',
                description: 'What you want to accomplish',
                required: true
            },
            {
                name: 'experience_level',
                description: 'Your Grasshopper experience (beginner/intermediate/advanced)',
                required: false
            }
        ]
    },
    // Original Prompts
    {
        name: 'analyze-canvas',
        description: 'Analyze the current Grasshopper canvas structure and suggest improvements',
        arguments: [
            {
                name: 'focus_area',
                description: 'Specific area to focus on (e.g., "performance", "organization", "data-flow")',
                required: false
            }
        ]
    },
    {
        name: 'create-component-script',
        description: 'Generate a Python/C# script for a Grasshopper component based on requirements',
        arguments: [
            {
                name: 'component_uuid',
                description: 'UUID of the target component',
                required: true
            },
            {
                name: 'requirements',
                description: 'What the script should do',
                required: true
            },
            {
                name: 'language',
                description: 'Programming language (python/cs)',
                required: false
            }
        ]
    },
    {
        name: 'debug-script-error',
        description: 'Help debug errors in a Grasshopper script component',
        arguments: [
            {
                name: 'component_uuid',
                description: 'UUID of the component with the error',
                required: true
            },
            {
                name: 'error_message',
                description: 'The error message from Grasshopper',
                required: false
            }
        ]
    },
    {
        name: 'optimize-definition',
        description: 'Suggest optimizations for the Grasshopper definition',
        arguments: [
            {
                name: 'optimization_goal',
                description: 'What to optimize for (speed/memory/clarity)',
                required: false
            }
        ]
    },
    {
        name: 'document-workflow',
        description: 'Generate documentation for the current Grasshopper workflow',
        arguments: [
            {
                name: 'detail_level',
                description: 'Level of detail (overview/detailed/technical)',
                required: false
            },
            {
                name: 'include_screenshots',
                description: 'Whether to include visual references',
                required: false
            }
        ]
    }
];
//# sourceMappingURL=promptDefinitions.js.map