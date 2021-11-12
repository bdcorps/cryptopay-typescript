"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAccount = exports.getUserByEmail = exports.upsertUser = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getUserByID = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma.user.findUnique({
        where: { id }
    });
});
const getUserByEmail = (email) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma.user.findUnique({
        where: { email }
    });
});
exports.getUserByEmail = getUserByEmail;
const upsertUser = (data) => __awaiter(void 0, void 0, void 0, function* () {
    console.log({ data });
    return yield prisma.user.upsert({
        where: {
            email: data.email
        },
        update: Object.assign({}, data),
        create: data,
    });
});
exports.upsertUser = upsertUser;
// const updateUser = async (id: string, data) => {
//   return await prisma.user.update({
//     where: {
//       id
//     },
//     data
//   })
// }
const createAccount = (userId, address) => __awaiter(void 0, void 0, void 0, function* () {
    let account = yield prisma.account.findFirst({
        where: { userId, address }
    });
    if (!account) {
        account = yield prisma.account.create({
            data: {
                userId,
                address
            }
        });
    }
    return account;
});
exports.createAccount = createAccount;
//# sourceMappingURL=_db.js.map