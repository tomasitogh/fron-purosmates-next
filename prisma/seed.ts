
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const categories = [
        { description: 'Bombillas' },
        { description: 'Mates' },
        { description: 'Yerbas' },
        { description: 'Set Materos' },
        { description: 'Termos' },
        { description: 'Accesorios' },
    ]

    console.log('Start seeding ...')
    for (const c of categories) {
        const category = await prisma.category.upsert({
            where: { description: c.description },
            update: {},
            create: {
                description: c.description,
            },
        })
        console.log(`Created category with id: ${category.id}`)
    }
    console.log('Seeding finished.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
