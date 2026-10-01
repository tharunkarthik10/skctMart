import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const DB_FILE = path.join(process.cwd(), 'data', 'mock_db.json');

const defaultDb = {
    user: [],
    component: [],
    order: [],
    chat: [],
    message: [],
    event: [],
    news: [],
    problemStatement: [],
    bid: []
};

let db = { ...defaultDb };

if (fs.existsSync(DB_FILE)) {
    try {
        db = { ...defaultDb, ...JSON.parse(fs.readFileSync(DB_FILE, 'utf-8')) };
        if (!db.bid) db.bid = [];
    } catch (e) {
        console.error("Failed to load mock_db.json", e);
    }
}

const saveDb = () => {
    try {
        if (!fs.existsSync(path.dirname(DB_FILE))) {
            fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
        }
        fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    } catch (e) {
        console.error("Failed to save mock_db.json", e);
    }
};

const filterItems = (items, where) => {
    if (!where) return items;
    return items.filter(item => {
        for (const key in where) {
            const cond = where[key];
            if (key === 'OR' && Array.isArray(cond)) {
                const matchesAny = cond.some(subWhere => {
                    for (const subKey in subWhere) {
                        const subCond = subWhere[subKey];
                        if (typeof subCond === 'object' && subCond !== null) {
                            if (subCond.contains) {
                                const val = (item[subKey] || '').toString().toLowerCase();
                                const searchVal = subCond.contains.toLowerCase();
                                if (!val.includes(searchVal)) return false;
                            }
                        } else {
                            if (item[subKey] !== subCond) return false;
                        }
                    }
                    return true;
                });
                if (!matchesAny) return false;
            } else if (key === 'AND' && Array.isArray(cond)) {
                const matchesAll = cond.every(subWhere => {
                    for (const subKey in subWhere) {
                        if (item[subKey] !== subWhere[subKey]) return false;
                    }
                    return true;
                });
                if (!matchesAll) return false;
            } else if (typeof cond === 'object' && cond !== null) {
                if ('in' in cond) {
                    if (!Array.isArray(cond.in)) return false;
                    if (!cond.in.includes(item[key])) return false;
                } else if ('contains' in cond) {
                    const val = (item[key] || '').toString().toLowerCase();
                    const searchVal = cond.contains.toLowerCase();
                    if (!val.includes(searchVal)) return false;
                }
            } else {
                if (item[key] !== cond) return false;
            }
        }
        return true;
    });
};

const resolveIncludes = (item, include, modelName) => {
    if (!item || !include) return item;
    const newItem = { ...item };
    
    for (const key in include) {
        if (!include[key]) continue;
        
        if (modelName === 'chat') {
            if (key === 'buyer') {
                newItem.buyer = db.user.find(u => u.id === item.buyer_id) || null;
            }
            if (key === 'seller') {
                newItem.seller = db.user.find(u => u.id === item.seller_id) || null;
            }
            if (key === 'component') {
                newItem.component = db.component.find(c => c.id === item.component_id) || null;
            }
            if (key === 'messages') {
                let msgs = db.message.filter(m => m.chat_id === item.id);
                if (typeof include.messages === 'object' && include.messages.orderBy) {
                    const sortOrder = include.messages.orderBy.createdAt || include.messages.orderBy.created_at;
                    if (sortOrder === 'desc') {
                        msgs.sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at));
                    } else {
                        msgs.sort((a, b) => new Date(a.createdAt || a.created_at) - new Date(b.createdAt || b.created_at));
                    }
                } else {
                    msgs.sort((a, b) => new Date(a.createdAt || a.created_at) - new Date(b.createdAt || b.created_at));
                }
                newItem.messages = msgs;
            }
        } else if (modelName === 'component') {
            if (key === 'seller') {
                newItem.seller = db.user.find(u => u.id === item.seller_id) || null;
            }
            if (key === 'bids') {
                newItem.bids = (db.bid || []).filter(b => b.component_id === item.id);
            }
        } else if (modelName === 'bid') {
            if (key === 'bidder') {
                newItem.bidder = db.user.find(u => u.id === item.bidder_id) || null;
            }
            if (key === 'component') {
                newItem.component = db.component.find(c => c.id === item.component_id) || null;
            }
        } else if (modelName === 'message') {
            if (key === 'chat') {
                newItem.chat = db.chat.find(c => c.id === item.chat_id) || null;
            }
            if (key === 'sender') {
                newItem.sender = db.user.find(u => u.id === item.sender_id) || null;
            }
            if (key === 'receiver') {
                newItem.receiver = db.user.find(u => u.id === item.receiver_id) || null;
            }
        } else if (modelName === 'user') {
            if (key === 'components') {
                newItem.components = db.component.filter(c => c.seller_id === item.id);
            }
        }
    }
    
    return newItem;
};

const sortItems = (items, orderBy) => {
    if (!orderBy) return items;
    const sorted = [...items];
    const key = Object.keys(orderBy)[0];
    const direction = orderBy[key];
    
    sorted.sort((a, b) => {
        const valA = new Date(a[key]).getTime() || a[key];
        const valB = new Date(b[key]).getTime() || b[key];
        
        if (direction === 'desc') {
            return valB > valA ? 1 : valB < valA ? -1 : 0;
        } else {
            return valA > valB ? 1 : valA < valB ? -1 : 0;
        }
    });
    return sorted;
};

const takeItems = (items, take) => {
    if (take === undefined || take === null) return items;
    return items.slice(0, take);
};

const createMockModel = (modelName) => ({
    findMany: async (args = {}) => {
        let results = [...(db[modelName] || [])];
        results = filterItems(results, args.where);
        results = sortItems(results, args.orderBy);
        results = takeItems(results, args.take);
        results = results.map(item => resolveIncludes(item, args.include, modelName));
        return results;
    },
    findUnique: async (args) => {
        let item = (db[modelName] || []).find(item => item.id === args.where.id) || null;
        if (item) {
            item = resolveIncludes(item, args.include, modelName);
        }
        return item;
    },
    findFirst: async (args) => {
        let results = [...(db[modelName] || [])];
        results = filterItems(results, args.where);
        let item = results[0] || null;
        if (item) {
            item = resolveIncludes(item, args.include, modelName);
        }
        return item;
    },
    create: async (args) => {
        if (!db[modelName]) db[modelName] = [];
        const newItem = { id: Math.random().toString(36).substr(2, 9), createdAt: new Date(), updatedAt: new Date(), ...args.data };
        db[modelName].push(newItem);
        saveDb();
        return resolveIncludes(newItem, args.include, modelName);
    },
    update: async (args) => {
        if (!db[modelName]) db[modelName] = [];
        const idx = db[modelName].findIndex(item => item.id === args.where.id);
        if (idx !== -1) {
            db[modelName][idx] = { ...db[modelName][idx], ...args.data, updatedAt: new Date() };
            saveDb();
            return resolveIncludes(db[modelName][idx], args.include, modelName);
        }
        throw new Error('Not found');
    },
    upsert: async (args) => {
        if (!db[modelName]) db[modelName] = [];
        const idx = db[modelName].findIndex(item => item.id === args.where.id);
        if (idx !== -1) {
            db[modelName][idx] = { ...db[modelName][idx], ...args.update, updatedAt: new Date() };
            saveDb();
            return resolveIncludes(db[modelName][idx], args.include, modelName);
        }
        const newItem = { id: args.where.id || Math.random().toString(36).substr(2, 9), createdAt: new Date(), updatedAt: new Date(), ...args.create };
        db[modelName].push(newItem);
        saveDb();
        return resolveIncludes(newItem, args.include, modelName);
    },
    delete: async (args) => {
        if (!db[modelName]) db[modelName] = [];
        const idx = db[modelName].findIndex(item => item.id === args.where.id);
        if (idx !== -1) {
            const deletedItem = db[modelName][idx];
            db[modelName].splice(idx, 1);
            saveDb();
            return resolveIncludes(deletedItem, args.include, modelName);
        }
        throw new Error('Not found');
    },
    deleteMany: async (args = {}) => {
        if (!db[modelName]) db[modelName] = [];
        if (!args.where || Object.keys(args.where).length === 0) {
            db[modelName] = [];
        } else {
            db[modelName] = db[modelName].filter(item => {
                for (const key in args.where) {
                    if (item[key] !== args.where[key]) return true;
                }
                return false;
            });
        }
        saveDb();
        return { count: (db[modelName] || []).length };
    },
    createMany: async (args) => {
        if (!db[modelName]) db[modelName] = [];
        const newItems = args.data.map(item => ({
            id: Math.random().toString(36).substr(2, 9),
            createdAt: new Date(),
            updatedAt: new Date(),
            ...item
        }));
        db[modelName].push(...newItems);
        saveDb();
        return { count: newItems.length };
    }
});

const mockPrisma = {
    user: createMockModel('user'),
    component: createMockModel('component'),
    order: createMockModel('order'),
    chat: createMockModel('chat'),
    message: createMockModel('message'),
    event: createMockModel('event'),
    news: createMockModel('news'),
    problemStatement: createMockModel('problemStatement'),
    bid: createMockModel('bid'),
    $disconnect: async () => {},
    $connect: async () => {},
};

let prisma;

if (process.env.DATABASE_URL) {
    try {
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });
        const adapter = new PrismaPg(pool);
        prisma = new PrismaClient({ adapter });
    } catch (e) {
        console.warn("⚠️ Failed to initialize Prisma with DATABASE_URL, using local JSON database fallback:", e.message);
        prisma = mockPrisma;
    }
} else {
    console.log("ℹ️ No DATABASE_URL provided. Using local JSON database (data/mock_db.json).");
    prisma = mockPrisma;
}

export default prisma;
