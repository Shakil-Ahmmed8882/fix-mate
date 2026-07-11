import app from "./app";
import config from "./config";
import { prisma } from "./lib/prisma";

const PORT = config.port;

async function main() {
    try {
        await prisma.$connect();

        console.log(`DB connection is successful`);
        app.listen(PORT, () =>
            console.log(`Server is running on port: ${PORT}`));
    } catch (error) {
        console.log(`Error starting the server`, error);
        prisma.$disconnect();
        process.exit(1);
    }
}

main();
