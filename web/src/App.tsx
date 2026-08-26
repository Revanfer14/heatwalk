import { Route, Routes } from 'react-router-dom'
import MapRoot from '@/components/MapRoot'
import MapInstanceProvider from '@/components/MapInstanceProvider'
import AppStateProvider from '@/components/AppStateProvider'
import AppHeader from '@/components/AppHeader'
import ParentRoute from '@/routes/ParentRoute'
import DistrictRoute from '@/routes/DistrictRoute'

export default function App() {
  return (
    <MapInstanceProvider>
      <AppStateProvider>
        <MapRoot />
        <AppHeader />
        <Routes>
          <Route path="/" element={<ParentRoute />} />
          <Route path="/district" element={<DistrictRoute />} />
        </Routes>
      </AppStateProvider>
    </MapInstanceProvider>
  )
}
