"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ghPrompts = void 0;
exports.buildPromptMessage = buildPromptMessage;
exports.ghPrompts = [
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
// Helper function to build prompt messages from templates
function buildPromptMessage(promptName, args) {
    const prompt = exports.ghPrompts.find(p => p.name === promptName);
    if (!prompt) {
        throw new Error(`Prompt ${promptName} not found`);
    }
    let message = '';
    switch (promptName) {
        case 'analyze-canvas':
            message = `Please analyze the current Grasshopper canvas structure`;
            if (args.focus_area) {
                message += ` with a focus on ${args.focus_area}`;
            }
            message += '. Look for potential improvements in organization, performance, and data flow.';
            break;
        case 'create-component-script':
            message = `Create a ${args.language || 'Python'} script for Grasshopper component ${args.component_uuid}.\n`;
            message += `Requirements: ${args.requirements}\n`;
            message += `Include proper input/output handling and error checking.`;
            break;
        case 'debug-script-error':
            message = `Help debug the script in component ${args.component_uuid}.\n`;
            if (args.error_message) {
                message += `Error message: ${args.error_message}\n`;
            }
            message += `Analyze the code and suggest fixes.`;
            break;
        case 'optimize-definition':
            message = `Analyze the Grasshopper definition for optimization opportunities`;
            if (args.optimization_goal) {
                message += ` focusing on ${args.optimization_goal}`;
            }
            message += '. Suggest specific improvements.';
            break;
        case 'document-workflow':
            message = `Generate ${args.detail_level || 'detailed'} documentation for the current Grasshopper workflow.`;
            if (args.include_screenshots === 'true') {
                message += ' Reference key visual elements.';
            }
            break;
    }
    return message;
}
//# sourceMappingURL=grasshopper.prompts.js.map