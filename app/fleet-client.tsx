'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createCar, toggleCarRentStatus, addTransaction, deleteCar } from './actions';

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  currency: string;
  carId: string;
  userId: string;
}

interface Car {
  id: string;
  name: string;
  rented: boolean;
  transactions: Transaction[];
}

interface FleetClientProps {
  initialCars: Car[];
}

export default function FleetClient({ initialCars }: FleetClientProps) {
  const router = useRouter();
  const [carName, setCarName] = useState('');
  const [selectedCarId, setSelectedCarId] = useState('');
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('income');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [currency, setCurrency] = useState<'UAH' | 'USD'>('UAH');
  const [isPending, startTransition] = useTransition();

  // Визначаємо активне вибране авто для фінансової операції
  const activeCarId = selectedCarId || (initialCars.length > 0 ? initialCars[0].id : '');

  // Рахуємо баланс для кожного авто та загальний баланс автопарку окремо для UAH та USD
  let totalUahBalance = 0;
  let totalUsdBalance = 0;
  const carsWithBalances = initialCars.map((car) => {
    let uahBalance = 0;
    let usdBalance = 0;
    car.transactions.forEach((t) => {
      if (t.currency === 'USD') {
        if (t.type === 'income') {
          usdBalance += t.amount;
        } else {
          usdBalance -= t.amount;
        }
      } else {
        if (t.type === 'income') {
          uahBalance += t.amount;
        } else {
          uahBalance -= t.amount;
        }
      }
    });
    totalUahBalance += uahBalance;
    totalUsdBalance += usdBalance;
    return {
      ...car,
      uahBalance,
      usdBalance,
    };
  });

  const handleAddCar = () => {
    if (!carName.trim()) return;
    startTransition(async () => {
      const res = await createCar(carName);
      if (res.success) {
        setCarName('');
        router.refresh();
      } else {
        alert(res.error);
      }
    });
  };

  const handleToggleStatus = (id: string, currentRented: boolean) => {
    startTransition(async () => {
      const res = await toggleCarRentStatus(id, currentRented);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error);
      }
    });
  };

  const handleAddTransaction = () => {
    if (!activeCarId) {
      alert('Будь ласка, спочатку додайте автомобіль.');
      return;
    }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      alert('Сума операції повинна бути більшою за 0');
      return;
    }

    startTransition(async () => {
      const res = await addTransaction(activeCarId, transactionType, amt, description, currency);
      if (res.success) {
        setAmount('');
        setDescription('');
        router.refresh();
      } else {
        alert(res.error);
      }
    });
  };

  const handleDeleteCar = (id: string) => {
    if (!confirm('Ви впевнені, що хочете видалити цей автомобіль та всі його транзакції?')) {
      return;
    }
    startTransition(async () => {
      const res = await deleteCar(id);
      if (res.success) {
        // Якщо видалили вибране авто, скидаємо вибір
        if (selectedCarId === id) {
          setSelectedCarId('');
        }
        router.refresh();
      } else {
        alert(res.error);
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md relative">
      {isPending && (
        <div className="absolute top-4 right-4 flex items-center gap-2 text-sm text-blue-500 font-medium">
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Оновлення бази даних...
        </div>
      )}

      <h1 className="text-2xl font-bold mb-6 text-center text-blue-600">Система управління автопарком</h1>

      <div className="bg-blue-50 p-4 rounded mb-6 text-center">
        <h2 className="text-lg font-semibold text-gray-700">Загальний баланс автопарку</h2>
        <div className="flex justify-center gap-6 mt-1 text-3xl font-bold">
          <p className={totalUahBalance >= 0 ? 'text-green-600' : 'text-red-600'}>
            {totalUahBalance.toLocaleString('uk-UA')} ₴
          </p>
          <p className={totalUsdBalance >= 0 ? 'text-green-600' : 'text-red-600'}>
            ${totalUsdBalance.toLocaleString('uk-UA')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Блок створення авто */}
        <div className="border p-4 rounded bg-white">
          <h3 className="font-semibold mb-3 text-lg text-gray-900">Додати автомобіль</h3>
          <input
            type="text"
            placeholder="Назва (напр. Ford Fiesta 2016)"
            className="w-full border p-2 rounded mb-2 focus:outline-blue-500 text-gray-800"
            value={carName}
            onChange={(e) => setCarName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddCar();
            }}
          />
          <button
            onClick={handleAddCar}
            disabled={isPending}
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition disabled:bg-blue-300"
          >
            Додати в гараж
          </button>
        </div>

        {/* Блок операцій по авто */}
        <div className="border p-4 rounded bg-white">
          <h3 className="font-semibold mb-3 text-lg text-gray-900">Операція по конкретному авто</h3>

          <label className="block text-sm text-gray-600 mb-1">Виберіть автомобіль:</label>
          <select
            className="w-full border p-2 rounded mb-2 focus:outline-blue-500 text-gray-800"
            value={activeCarId}
            onChange={(e) => setSelectedCarId(e.target.value)}
          >
            {initialCars.length === 0 ? (
              <option value="">Нічого вибирати</option>
            ) : (
              initialCars.map((car) => (
                <option key={car.id} value={car.id}>
                  {car.name}
                </option>
              ))
            )}
          </select>

          <label className="block text-sm text-gray-600 mb-1">Тип операції:</label>
          <select
            className="w-full border p-2 rounded mb-2 focus:outline-blue-500 text-gray-800"
            value={transactionType}
            onChange={(e) => setTransactionType(e.target.value as 'income' | 'expense')}
          >
            <option value="income">Прибуток (Оренда)</option>
            <option value="expense">Витрата (СТО, ремонт, деталі)</option>
          </select>

          <div className="flex gap-2 mb-2">
            <input
              type="number"
              placeholder="Сума"
              className="flex-1 border p-2 rounded focus:outline-blue-500 text-gray-800 animate-none"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddTransaction();
              }}
            />
            <select
              className="border p-2 rounded focus:outline-blue-500 text-gray-800 bg-white font-semibold"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as 'UAH' | 'USD')}
            >
              <option value="UAH">₴ UAH</option>
              <option value="USD">$ USD</option>
            </select>
          </div>
          <input
            type="text"
            placeholder="Опис операції (напр. СТО, Оренда червень)"
            className="w-full border p-2 rounded mb-2 focus:outline-blue-500 text-gray-800"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddTransaction();
            }}
          />
          <button
            onClick={handleAddTransaction}
            disabled={isPending || initialCars.length === 0}
            className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600 transition disabled:bg-green-300"
          >
            Записати витрату/прибуток
          </button>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-bold mb-4 text-gray-950">Мій автопарк та аналітика</h3>

        {carsWithBalances.length === 0 ? (
          <p className="text-gray-500 italic text-center py-4">Гараж порожній. Додайте перше авто.</p>
        ) : (
          <div className="space-y-4">
            {carsWithBalances.map((car) => (
              <div
                key={car.id}
                className="border p-4 rounded-lg bg-gray-50 shadow-sm flex flex-col md:flex-row md:justify-between md:items-center gap-4"
              >
                <div>
                  <h4 className="text-lg font-bold text-gray-900" data-testid="car-title">
                    {car.name}
                  </h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        car.rented
                          ? 'bg-orange-200 text-orange-800'
                          : 'bg-green-200 text-green-800'
                      }`}
                    >
                      {car.rented ? 'В оренді' : 'Вільно'}
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        car.uahBalance >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      Баланс: {car.uahBalance.toLocaleString('uk-UA')} ₴
                    </span>
                    <span className="text-gray-300 text-xs">|</span>
                    <span
                      className={`text-sm font-medium ${
                        car.usdBalance >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      ${car.usdBalance.toLocaleString('uk-UA')}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Операцій записано: {car.transactions.length}
                  </div>

                  {car.transactions.length > 0 && (
                    <div className="mt-3 border-t pt-2 max-h-32 overflow-y-auto">
                      <p className="text-xs font-semibold text-gray-600 mb-1">Останні операції:</p>
                      <ul className="text-xs space-y-1 divide-y divide-gray-100">
                        {car.transactions.map((t) => (
                          <div key={t.id} className="flex justify-between items-center py-1 text-gray-700">
                            <span className="flex items-center gap-1.5">
                              <span className={t.type === 'income' ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                                {t.type === 'income' ? '+' : '-'}
                              </span>
                              <span className="truncate max-w-[200px]" title={t.description || ''}>
                                {t.description || (t.type === 'income' ? 'Прибуток' : 'Витрата')}
                              </span>
                            </span>
                            <span className={`font-semibold shrink-0 ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                              {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString('uk-UA')} {t.currency === 'USD' ? '$' : '₴'}
                            </span>
                          </div>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  <button
                    onClick={() => handleToggleStatus(car.id, car.rented)}
                    disabled={isPending}
                    className="text-sm bg-blue-100 text-blue-700 px-3 py-1.5 rounded hover:bg-blue-200 transition disabled:opacity-50 font-medium"
                  >
                    {car.rented ? 'Повернути з оренди' : 'Здати в оренду'}
                  </button>
                  <button
                    onClick={() => handleDeleteCar(car.id)}
                    disabled={isPending}
                    className="text-sm bg-red-100 text-red-600 px-3 py-1.5 rounded hover:bg-red-200 transition disabled:opacity-50 font-medium"
                  >
                    Видалити
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
