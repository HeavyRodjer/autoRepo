'use server';

import { revalidatePath } from 'next/cache';
import prisma from '../lib/prisma';

// Допоміжна функція для створення дефолтного користувача, оскільки транзакції вимагають userId
async function ensureDefaultUser() {
  const defaultUserId = 'default-admin-user';
  return await prisma.user.upsert({
    where: { id: defaultUserId },
    update: {},
    create: {
      id: defaultUserId,
      name: 'Адміністратор',
    },
  });
}

// Отримання списку автомобілів разом із їхніми транзакціями
export async function getCars() {
  try {
    const cars = await prisma.car.findMany({
      include: {
        transactions: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
    return { success: true, data: cars };
  } catch (error: any) {
    console.error('Error fetching cars:', error);
    return { success: false, error: error.message || 'Не вдалося завантажити автомобілі' };
  }
}

// Створення нового автомобіля
export async function createCar(name: string) {
  try {
    if (!name || name.trim() === '') {
      throw new Error('Назва автомобіля не може бути порожньою');
    }
    const car = await prisma.car.create({
      data: {
        name: name.trim(),
        rented: false,
      },
    });
    revalidatePath('/');
    return { success: true, data: car };
  } catch (error: any) {
    console.error('Error creating car:', error);
    return { success: false, error: error.message || 'Не вдалося додати автомобіль' };
  }
}

// Зміна статусу оренди автомобіля
export async function toggleCarRentStatus(id: string, currentRented: boolean) {
  try {
    const car = await prisma.car.update({
      where: { id },
      data: {
        rented: !currentRented,
      },
    });
    revalidatePath('/');
    return { success: true, data: car };
  } catch (error: any) {
    console.error('Error toggling rent status:', error);
    return { success: false, error: error.message || 'Не вдалося змінити статус оренди' };
  }
}

// Додавання фінансової операції для автомобіля
export async function addTransaction(
  carId: string,
  type: 'income' | 'expense',
  amount: number,
  description?: string,
  currency: string = 'UAH'
) {
  try {
    if (!carId) {
      throw new Error('Автомобіль не вибрано');
    }
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Сума операції повинна бути більшою за 0');
    }
    if (type !== 'income' && type !== 'expense') {
      throw new Error('Неправильний тип операції');
    }
    if (currency !== 'UAH' && currency !== 'USD') {
      throw new Error('Неправильна валюта операції');
    }

    const defaultUser = await ensureDefaultUser();

    const transaction = await prisma.transaction.create({
      data: {
        amount,
        type,
        description: description?.trim() || null,
        currency,
        carId,
        userId: defaultUser.id,
      },
    });
    revalidatePath('/');
    return { success: true, data: transaction };
  } catch (error: any) {
    console.error('Error adding transaction:', error);
    return { success: false, error: error.message || 'Не вдалося додати операцію' };
  }
}

// Видалення автомобіля разом із його транзакціями (завдяки cascade delete)
export async function deleteCar(id: string) {
  try {
    await prisma.car.delete({
      where: { id },
    });
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting car:', error);
    return { success: false, error: error.message || 'Не вдалося видалити автомобіль' };
  }
}
