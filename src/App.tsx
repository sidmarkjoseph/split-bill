import { BillProvider } from './context/BillContext.tsx'
import Header from './components/Header.tsx'
import PeopleManager from './components/PeopleManager.tsx'
import SplitModeToggle from './components/SplitModeToggle.tsx'
import ItemList from './components/ItemList.tsx'
import TaxTipSection from './components/TaxTipSection.tsx'
import Summary from './components/Summary.tsx'

export default function App() {
  return (
    <BillProvider>
      <div className="min-h-screen bg-gray-100">
        <div className="mx-auto max-w-2xl px-4 pb-8">
          <Header />
          <div className="space-y-6">
            <PeopleManager />
            <SplitModeToggle />
            <ItemList />
            <TaxTipSection />
            <Summary />
          </div>
        </div>
      </div>
    </BillProvider>
  )
}
