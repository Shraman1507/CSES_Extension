
async function getTemplates() {
    const result = await chrome.storage.local.get('templates');
    return result.templates || {};
}

async function saveTemplates(templates) {
    await chrome.storage.local.set({ templates });
}

async function getTemplatesForLanguage(language) {
    const templates = await getTemplates();
    return templates[language] || [];
}

async function saveTemplate(language, template) {
    const templates = await getTemplates();
    if (!templates[language]) {
        templates[language] = [];
    }

    if (template.id) {
        const index = templates[language].findIndex(t => t.id === template.id);
        if (index !== -1) {
            templates[language][index] = template;
        } else {
            templates[language].push(template);
        }
    } else {
        template.id = `template-${Date.now()}`;
        templates[language].push(template);
    }

    await saveTemplates(templates);
}

async function deleteTemplate(language, templateId) {
    const templates = await getTemplates();
    if (templates[language]) {
        templates[language] = templates[language].filter(t => t.id !== templateId);
        await saveTemplates(templates);
    }
}
