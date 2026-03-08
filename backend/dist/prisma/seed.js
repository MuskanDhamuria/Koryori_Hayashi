import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { env } from "../src/config/env.js";
const prisma = new PrismaClient();
const categorySeed = [
    { slug: "appetizers", name: "Appetizers" },
    { slug: "mains", name: "Mains" },
    { slug: "ramen", name: "Ramen" },
    { slug: "desserts", name: "Desserts" },
    { slug: "drinks", name: "Drinks" }
];
const menuSeed = [
    {
        sku: "APP-101",
        name: "Japanese Fresh Oyster",
        description: "Fresh Japanese oyster served chilled",
        imageUrl: "https://images.unsplash.com/photo-1604908177522-432b8d7a9c8d",
        price: 3.8,
        cost: 1.6,
        categorySlug: "appetizers",
        isHighMargin: false,
        weatherTags: ["sunny", "hot"],
        flavorProfile: { umami: 0.9, citrus: 0.2, refreshing: 0.8, hearty: 0.2 },
        inventory: { ingredientName: "Fresh Oyster", stockOnHand: 24, reorderPoint: 12, unit: "pcs" }
    },
    {
        sku: "APP-102",
        name: "Crab Meat Cream Croquette",
        description: "Crispy croquette filled with creamy crab meat",
        imageUrl: "https://images.unsplash.com/photo-1600891964599-f61ba0e24092",
        price: 4.8,
        cost: 1.9,
        categorySlug: "appetizers",
        isHighMargin: true,
        weatherTags: [],
        flavorProfile: { umami: 0.8, citrus: 0.1, refreshing: 0.2, hearty: 0.9 },
        inventory: { ingredientName: "Crab Cream Filling", stockOnHand: 20, reorderPoint: 8, unit: "pcs" }
    },
    {
        sku: "APP-103",
        name: "Fried Oyster",
        description: "Golden deep-fried oysters with crispy coating",
        imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947",
        price: 3.8,
        cost: 1.5,
        categorySlug: "appetizers",
        isHighMargin: true,
        weatherTags: [],
        flavorProfile: { umami: 0.9, citrus: 0.1, refreshing: 0.3, hearty: 0.7 },
        inventory: { ingredientName: "Breaded Oyster", stockOnHand: 22, reorderPoint: 10, unit: "pcs" }
    },
    {
        sku: "APP-104",
        name: "Geso Karaage (Squid)",
        description: "Japanese fried squid karaage",
        imageUrl: "https://images.unsplash.com/photo-1625944525533-473f1c5c2a6a",
        price: 4.8,
        cost: 2.0,
        categorySlug: "appetizers",
        isHighMargin: true,
        weatherTags: [],
        flavorProfile: { umami: 0.8, citrus: 0.1, refreshing: 0.4, hearty: 0.6 },
        inventory: { ingredientName: "Squid", stockOnHand: 18, reorderPoint: 8, unit: "servings" }
    },
    {
        sku: "APP-105",
        name: "Aji Fry",
        description: "Breaded and fried Japanese horse mackerel",
        imageUrl: "https://images.unsplash.com/photo-1598514982501-3b7b02c27d64",
        price: 3.8,
        cost: 1.4,
        categorySlug: "appetizers",
        isHighMargin: true,
        weatherTags: [],
        flavorProfile: { umami: 0.7, citrus: 0.2, refreshing: 0.3, hearty: 0.6 },
        inventory: { ingredientName: "Horse Mackerel", stockOnHand: 16, reorderPoint: 6, unit: "fillets" }
    },
    {
        sku: "APP-106",
        name: "King Prawn",
        description: "Large king prawn, lightly fried",
        imageUrl: "https://images.unsplash.com/photo-1604908176997-125f25cc6c2c",
        price: 7.8,
        cost: 3.2,
        categorySlug: "appetizers",
        isHighMargin: false,
        weatherTags: [],
        flavorProfile: { umami: 0.8, citrus: 0.2, refreshing: 0.4, hearty: 0.5 },
        inventory: { ingredientName: "King Prawn", stockOnHand: 14, reorderPoint: 6, unit: "pcs" }
    },
    {
        sku: "MAIN-107",
        name: "Mentaiko Pasta",
        description: "Japanese pasta with creamy cod roe sauce",
        imageUrl: "https://images.unsplash.com/photo-1608756687911-aa1599ab3bd9",
        price: 9.8,
        cost: 3.4,
        categorySlug: "mains",
        isHighMargin: true,
        weatherTags: [],
        flavorProfile: { umami: 0.9, citrus: 0.1, refreshing: 0.2, hearty: 0.8 },
        inventory: { ingredientName: "Cod Roe", stockOnHand: 18, reorderPoint: 8, unit: "portions" }
    },
    {
        sku: "MAIN-108",
        name: "Creamy Truffle Mushroom Pasta",
        description: "Rich truffle cream pasta with mushrooms",
        imageUrl: "https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5",
        price: 9.8,
        cost: 3.8,
        categorySlug: "mains",
        isHighMargin: true,
        weatherTags: [],
        flavorProfile: { umami: 0.9, citrus: 0.0, refreshing: 0.1, hearty: 0.9 },
        inventory: { ingredientName: "Truffle Mushroom Sauce", stockOnHand: 14, reorderPoint: 6, unit: "portions" }
    },
    {
        sku: "MAIN-109",
        name: "Chicken/Pork Katsu Don",
        description: "Breaded cutlet served over rice with egg and sauce",
        imageUrl: "https://images.unsplash.com/photo-1604908177522-432b8d7a9c8d",
        price: 8.8,
        cost: 3.1,
        categorySlug: "mains",
        isHighMargin: true,
        weatherTags: [],
        flavorProfile: { umami: 0.8, citrus: 0.1, refreshing: 0.2, hearty: 0.9 },
        inventory: { ingredientName: "Katsu Cutlet", stockOnHand: 18, reorderPoint: 8, unit: "servings" }
    },
    {
        sku: "MAIN-110",
        name: "Chicken Nanban Don",
        description: "Japanese fried chicken with tangy sauce over rice",
        imageUrl: "https://images.unsplash.com/photo-1604908176997-125f25cc6c2c",
        price: 8.8,
        cost: 3.0,
        categorySlug: "mains",
        isHighMargin: true,
        weatherTags: [],
        flavorProfile: { umami: 0.8, citrus: 0.3, refreshing: 0.3, hearty: 0.8 },
        inventory: { ingredientName: "Nanban Chicken", stockOnHand: 18, reorderPoint: 8, unit: "servings" }
    },
    {
        sku: "MAIN-111",
        name: "Salmon Teriyaki Don",
        description: "Grilled salmon with teriyaki sauce over rice",
        imageUrl: "https://images.unsplash.com/photo-1553621042-f6e147245754",
        price: 9.8,
        cost: 4.2,
        categorySlug: "mains",
        isHighMargin: false,
        weatherTags: [],
        flavorProfile: { umami: 0.9, citrus: 0.2, refreshing: 0.4, hearty: 0.7 },
        inventory: { ingredientName: "Salmon Fillet", stockOnHand: 12, reorderPoint: 6, unit: "fillets" }
    },
    {
        sku: "RAM-112",
        name: "Kitsune Udon",
        description: "Udon noodles with sweet fried tofu",
        imageUrl: "https://images.unsplash.com/photo-1610554666975-339e1f736bc8",
        price: 7.8,
        cost: 2.9,
        categorySlug: "ramen",
        isHighMargin: true,
        weatherTags: ["rainy", "cold"],
        flavorProfile: { umami: 0.7, citrus: 0.1, refreshing: 0.3, hearty: 0.7 },
        inventory: { ingredientName: "Udon Broth", stockOnHand: 30, reorderPoint: 15, unit: "bowls" }
    },
    {
        sku: "RAM-113",
        name: "Sukiyaki Beef Udon",
        description: "Udon noodles with sweet soy beef sukiyaki",
        imageUrl: "https://images.unsplash.com/photo-1610554666975-339e1f736bc8",
        price: 9.8,
        cost: 4.0,
        categorySlug: "ramen",
        isHighMargin: false,
        weatherTags: ["rainy", "cold"],
        flavorProfile: { umami: 0.9, citrus: 0.1, refreshing: 0.2, hearty: 0.9 },
        inventory: { ingredientName: "Sukiyaki Beef", stockOnHand: 14, reorderPoint: 6, unit: "bowls" }
    },
    {
        sku: "RAM-114",
        name: "Tempura Udon",
        description: "Udon noodle soup served with crispy tempura",
        imageUrl: "https://images.unsplash.com/photo-1610554666975-339e1f736bc8",
        price: 11.8,
        cost: 4.6,
        categorySlug: "ramen",
        isHighMargin: true,
        weatherTags: ["rainy", "cold"],
        flavorProfile: { umami: 0.8, citrus: 0.1, refreshing: 0.3, hearty: 0.8 },
        inventory: { ingredientName: "Tempura Set", stockOnHand: 12, reorderPoint: 6, unit: "bowls" }
    },
    {
        sku: "DES-115",
        name: "Ice Cream (Matcha/Yuzu/Black Sesame/Houjicha/Jersey Milk)",
        description: "Japanese flavored ice cream selection",
        imageUrl: "https://images.unsplash.com/photo-1563805042-7684c019e1cb",
        price: 2.5,
        cost: 0.8,
        categorySlug: "desserts",
        isHighMargin: true,
        weatherTags: ["sunny", "hot"],
        flavorProfile: { umami: 0.3, citrus: 0.6, refreshing: 0.8, hearty: 0.2 },
        inventory: { ingredientName: "Ice Cream Scoops", stockOnHand: 40, reorderPoint: 15, unit: "scoops" }
    },
    {
        sku: "DES-116",
        name: "Monaka Shell Ice Cream",
        description: "Ice cream served in crispy monaka wafer shell",
        imageUrl: "https://images.unsplash.com/photo-1505253216365-73a1f6e8b6af",
        price: 3.0,
        cost: 1.0,
        categorySlug: "desserts",
        isHighMargin: true,
        weatherTags: [],
        flavorProfile: { umami: 0.3, citrus: 0.4, refreshing: 0.7, hearty: 0.3 },
        inventory: { ingredientName: "Monaka Shell", stockOnHand: 28, reorderPoint: 10, unit: "pcs" }
    },
    {
        sku: "DES-117",
        name: "Tempura Ice Cream",
        description: "Deep fried ice cream (vanilla or chocolate)",
        imageUrl: "https://images.unsplash.com/photo-1551024601-bec78aea704b",
        price: 4.8,
        cost: 1.7,
        categorySlug: "desserts",
        isHighMargin: true,
        isNew: true,
        weatherTags: [],
        flavorProfile: { umami: 0.2, citrus: 0.2, refreshing: 0.5, hearty: 0.7 },
        inventory: { ingredientName: "Tempura Ice Cream", stockOnHand: 20, reorderPoint: 8, unit: "servings" }
    },
    {
        sku: "APP-118",
        name: "Spicy Tuna Roll",
        description: "Fresh tuna mixed with spicy mayo and wrapped with rice and nori",
        imageUrl: "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56",
        price: 14.99,
        cost: 5.6,
        categorySlug: "appetizers",
        isHighMargin: true,
        spicyLevel: 2,
        weatherTags: ["sunny", "hot"],
        flavorProfile: { umami: 0.8, citrus: 0.3, refreshing: 0.6, hearty: 0.4 },
        inventory: { ingredientName: "Spicy Tuna Mix", stockOnHand: 12, reorderPoint: 5, unit: "rolls" }
    },
    {
        sku: "MAIN-119",
        name: "Volcano Ramen",
        description: "Extra spicy ramen with chili oil, minced pork, and soft boiled egg",
        imageUrl: "https://images.unsplash.com/photo-1617093727343-374698b1b08d",
        price: 17.99,
        cost: 6.8,
        categorySlug: "mains",
        isHighMargin: true,
        spicyLevel: 4,
        weatherTags: ["rainy", "cold"],
        flavorProfile: { umami: 0.9, citrus: 0.1, refreshing: 0.2, hearty: 1.0 },
        inventory: { ingredientName: "Spicy Ramen Base", stockOnHand: 10, reorderPoint: 4, unit: "bowls" }
    },
    {
        sku: "APP-120",
        name: "Spicy Karaage Chicken",
        description: "Japanese fried chicken tossed in spicy chili sauce",
        imageUrl: "https://images.unsplash.com/photo-1604908177522-040a5c1a3f10",
        price: 10.99,
        cost: 4.1,
        categorySlug: "appetizers",
        isHighMargin: true,
        spicyLevel: 3,
        weatherTags: [],
        flavorProfile: { umami: 0.8, citrus: 0.2, refreshing: 0.3, hearty: 0.7 },
        inventory: { ingredientName: "Karaage Chicken", stockOnHand: 16, reorderPoint: 6, unit: "servings" }
    },
    {
        sku: "APP-121",
        name: "Truffle Salmon Roll",
        description: "Seared salmon sushi roll with truffle oil and avocado",
        imageUrl: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351",
        price: 18.99,
        cost: 7.0,
        categorySlug: "appetizers",
        isHighMargin: true,
        isNew: true,
        weatherTags: ["sunny"],
        flavorProfile: { umami: 0.9, citrus: 0.2, refreshing: 0.6, hearty: 0.5 },
        inventory: { ingredientName: "Salmon Roll Set", stockOnHand: 10, reorderPoint: 4, unit: "rolls" }
    },
    {
        sku: "DES-122",
        name: "Matcha Cheesecake",
        description: "Creamy cheesecake infused with premium Japanese matcha",
        imageUrl: "https://images.unsplash.com/photo-1586985289906-406988974504",
        price: 7.99,
        cost: 2.5,
        categorySlug: "desserts",
        isHighMargin: true,
        isNew: true,
        weatherTags: [],
        flavorProfile: { umami: 0.3, citrus: 0.2, refreshing: 0.5, hearty: 0.6 },
        inventory: { ingredientName: "Matcha Cream", stockOnHand: 10, reorderPoint: 6, unit: "slices" }
    },
    {
        sku: "DRK-123",
        name: "Yuzu Sparkling Soda",
        description: "Refreshing Japanese citrus soda with yuzu flavor",
        imageUrl: "https://images.unsplash.com/photo-1558640479-823d3b9c7c2d",
        price: 4.99,
        cost: 1.1,
        categorySlug: "drinks",
        isHighMargin: true,
        isNew: true,
        weatherTags: ["sunny", "hot"],
        flavorProfile: { umami: 0.1, citrus: 0.9, refreshing: 1.0, hearty: 0.1 },
        inventory: { ingredientName: "Yuzu Syrup", stockOnHand: 14, reorderPoint: 6, unit: "bottles" }
    },
    {
        sku: "DRK-124",
        name: "Iced Lemon Tea",
        description: "Refreshing black tea served over ice with fresh lemon slices for a light citrus taste.",
        imageUrl: "images/drinks/iced-lemon-tea.jpg",
        price: 3.5,
        cost: 0.9,
        categorySlug: "drinks",
        isHighMargin: true,
        weatherTags: [],
        flavorProfile: { umami: 0.1, citrus: 0.6, refreshing: 0.8, hearty: 0.1 },
        inventory: { ingredientName: "Lemon Tea Mix", stockOnHand: 24, reorderPoint: 8, unit: "cups" }
    },
    {
        sku: "DRK-125",
        name: "Thai Milk Tea",
        description: "Classic Thai-style tea brewed strong and blended with sweetened milk, served chilled.",
        imageUrl: "images/drinks/thai-milk-tea.jpg",
        price: 4.5,
        cost: 1.2,
        categorySlug: "drinks",
        isHighMargin: true,
        weatherTags: [],
        flavorProfile: { umami: 0.2, citrus: 0.0, refreshing: 0.5, hearty: 0.4 },
        inventory: { ingredientName: "Thai Tea Blend", stockOnHand: 20, reorderPoint: 8, unit: "cups" }
    },
    {
        sku: "DRK-126",
        name: "Fresh Watermelon Juice",
        description: "Freshly blended watermelon juice with no added sugar, naturally sweet and hydrating.",
        imageUrl: "images/drinks/watermelon-juice.jpg",
        price: 5.5,
        cost: 1.8,
        categorySlug: "drinks",
        isHighMargin: false,
        isNew: true,
        weatherTags: ["sunny", "hot"],
        flavorProfile: { umami: 0.0, citrus: 0.1, refreshing: 1.0, hearty: 0.0 },
        inventory: { ingredientName: "Watermelon", stockOnHand: 18, reorderPoint: 6, unit: "cups" }
    }
];
async function main() {
    const passwordHash = await bcrypt.hash(env.SEED_STAFF_PASSWORD, 12);
    await prisma.restaurantTable.createMany({
        data: [
            { code: "A-1", label: "Table A-1", seatCount: 2 },
            { code: "A-2", label: "Table A-2", seatCount: 2 },
            { code: "B-1", label: "Table B-1", seatCount: 4 },
            { code: "B-2", label: "Table B-2", seatCount: 4 }
        ],
        skipDuplicates: true
    });
    await Promise.all(categorySeed.map((category) => prisma.category.upsert({
        where: { slug: category.slug },
        update: { name: category.name },
        create: category
    })));
    const categories = await prisma.category.findMany();
    const categoryMap = new Map(categories.map((category) => [category.slug, category.id]));
    for (const item of menuSeed) {
        const menuItem = await prisma.menuItem.upsert({
            where: { sku: item.sku },
            update: {
                name: item.name,
                description: item.description,
                imageUrl: item.imageUrl,
                price: item.price,
                cost: item.cost,
                isHighMargin: item.isHighMargin,
                isNew: item.isNew ?? false,
                weatherTags: item.weatherTags,
                flavorProfile: item.flavorProfile,
                categoryId: categoryMap.get(item.categorySlug)
            },
            create: {
                sku: item.sku,
                name: item.name,
                description: item.description,
                imageUrl: item.imageUrl,
                price: item.price,
                cost: item.cost,
                isHighMargin: item.isHighMargin,
                isNew: item.isNew ?? false,
                weatherTags: item.weatherTags,
                flavorProfile: item.flavorProfile,
                categoryId: categoryMap.get(item.categorySlug)
            }
        });
        await prisma.inventoryItem.upsert({
            where: { menuItemId: menuItem.id },
            update: {
                ingredientName: item.inventory.ingredientName,
                stockOnHand: item.inventory.stockOnHand,
                reorderPoint: item.inventory.reorderPoint,
                unit: item.inventory.unit
            },
            create: {
                menuItemId: menuItem.id,
                ingredientName: item.inventory.ingredientName,
                stockOnHand: item.inventory.stockOnHand,
                reorderPoint: item.inventory.reorderPoint,
                unit: item.inventory.unit
            }
        });
    }
    const staffUser = await prisma.user.upsert({
        where: { email: env.SEED_STAFF_EMAIL },
        update: {
            fullName: "Restaurant Admin",
            passwordHash,
            role: "ADMIN"
        },
        create: {
            email: env.SEED_STAFF_EMAIL,
            fullName: "Restaurant Admin",
            passwordHash,
            role: "ADMIN"
        }
    });
    const customer = await prisma.user.upsert({
        where: { phoneNumber: "+1 (555) 123-4567" },
        update: {
            fullName: "Yuki Tanaka",
            referralCode: "YUKI2026"
        },
        create: {
            phoneNumber: "+1 (555) 123-4567",
            fullName: "Yuki Tanaka",
            role: "CUSTOMER",
            referralCode: "YUKI2026"
        }
    });
    await prisma.loyaltyAccount.upsert({
        where: { userId: customer.id },
        update: {
            pointsBalance: 850,
            tier: "gold"
        },
        create: {
            userId: customer.id,
            pointsBalance: 850,
            tier: "gold"
        }
    });
    const existingOrders = await prisma.order.count();
    if (existingOrders === 0) {
        const seededMenuItems = await prisma.menuItem.findMany({
            include: { category: true }
        });
        const table = await prisma.restaurantTable.findFirst({
            where: { code: "A-1" }
        });
        if (table) {
            for (let dayOffset = 0; dayOffset < 21; dayOffset += 1) {
                const orderedAt = new Date();
                orderedAt.setDate(orderedAt.getDate() - dayOffset);
                orderedAt.setHours(11 + (dayOffset % 4), 15, 0, 0);
                const primaryItem = seededMenuItems[dayOffset % seededMenuItems.length];
                const secondaryItem = seededMenuItems[(dayOffset + 1) % seededMenuItems.length];
                const items = [
                    { menuItem: primaryItem, quantity: 1 + (dayOffset % 2) },
                    { menuItem: secondaryItem, quantity: 1 }
                ];
                const subtotal = items.reduce((sum, item) => sum + Number(item.menuItem.price) * item.quantity, 0);
                const taxAmount = Number((subtotal * 0.09).toFixed(2));
                const totalAmount = Number((subtotal + taxAmount).toFixed(2));
                await prisma.order.create({
                    data: {
                        orderNumber: `KH-SEED-${dayOffset.toString().padStart(3, "0")}`,
                        userId: customer.id,
                        tableId: table.id,
                        status: "COMPLETED",
                        orderedAt,
                        completedAt: orderedAt,
                        subtotalAmount: subtotal,
                        taxAmount,
                        totalAmount,
                        orderItems: {
                            create: items.map((item) => ({
                                menuItemId: item.menuItem.id,
                                quantity: item.quantity,
                                unitPrice: Number(item.menuItem.price),
                                lineTotal: Number((Number(item.menuItem.price) * item.quantity).toFixed(2))
                            }))
                        },
                        payment: {
                            create: {
                                method: dayOffset % 2 === 0 ? "CARD" : "MOBILE",
                                status: "PAID",
                                amount: totalAmount,
                                paidAt: orderedAt
                            }
                        }
                    }
                });
            }
        }
    }
    console.log(`Seed complete. Staff login: ${staffUser.email}`);
}
main()
    .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
