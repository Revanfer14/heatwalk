import { Route, Routes } from 'react-router-dom'
import MapRoot from '@/components/MapRoot'
import MapInstanceProvider from '@/components/MapInstanceProvider'
import AppStateProvider from '@/components/AppStateProvider'
import FloatingControls from '@/components/FloatingControls'
import ParentRoute from '@/routes/ParentRoute'
import DistrictRoute from '@/routes/DistrictRoute'
import MethodologyRoute from '@/routes/MethodologyRoute'

export default function App() {
  return (
    <MapInstanceProvider>
      <AppStateProvider>
        <MapRoot />
        <FloatingControls />
        <Routes>
          <Route path="/" element={<ParentRoute />} />
          <Route path="/district" element={<DistrictRoute />} />
          <Route path="/methodology" element={<MethodologyRoute />} />
        </Routes>
      </AppStateProvider>
    </MapInstanceProvider>
  )
}
