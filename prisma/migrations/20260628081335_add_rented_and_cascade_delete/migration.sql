-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_carId_fkey";

-- AlterTable
ALTER TABLE "Car" ADD COLUMN     "rented" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE CASCADE ON UPDATE CASCADE;
