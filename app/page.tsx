import { getCars } from './actions';
import FleetClient from './fleet-client';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const response = await getCars();
  const cars = response.success && response.data ? response.data : [];

  return <FleetClient initialCars={cars} />;
}
