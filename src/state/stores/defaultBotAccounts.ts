
const now = new Date().toISOString();

const defaultBotAccounts = [
    {
        id: "00000002-0000-8888-8000-000000000000@2c895908-04e0-4952-89fd-54b0046d6288",
        name: "ADO PR Bot",
        description: "A bot that merges pull requests",
        exactMatch: true,
        createdAt: now,
        updatedAt: now,
        isUpdatable: false
    }
];

export default defaultBotAccounts;