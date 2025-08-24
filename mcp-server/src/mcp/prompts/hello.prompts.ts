export const helloPrompts = [
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
    {
        name: 'code-review',
        description: 'Review a Grasshopper Python/C# script',
        arguments: [
            {
                name: 'script_path',
                description: 'Path to the script file to review',
                required: true
            },
            {
                name: 'focus',
                description: 'What to focus on (performance/style/bugs/all)',
                required: false
            }
        ]
    }
];

export function buildHelloPromptMessage(promptName: string, args: Record<string, any>): string {
    switch (promptName) {
        case 'explain-extension':
            const detail = args.detail_level || 'detailed';
            return `Please explain what the GH Bridge VS Code extension does. Provide a ${detail} explanation covering its purpose, main features, and how it connects VS Code with Grasshopper.`;
            
        case 'suggest-workflow':
            let message = `Suggest a Grasshopper workflow to accomplish: ${args.task}.`;
            if (args.experience_level) {
                message += ` The user has ${args.experience_level} experience with Grasshopper.`;
            }
            message += ' Include specific components and connections.';
            return message;
            
        case 'code-review':
            let review = `Please review the Grasshopper script at ${args.script_path}.`;
            if (args.focus) {
                review += ` Focus on ${args.focus}.`;
            } else {
                review += ' Check for bugs, performance issues, and code style.';
            }
            return review;
            
        default:
            return `Hello from GH Bridge! This is prompt: ${promptName}`;
    }
}