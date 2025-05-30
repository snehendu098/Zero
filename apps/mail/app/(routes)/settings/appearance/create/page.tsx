import { SettingsCard } from '@/components/settings/settings-card'
import CreateThemePage from '@/components/theme/create-theme'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import React from 'react'
import { Link, useNavigate } from 'react-router'

const Page = () => {

    const navigate = useNavigate()

    return (
        <div className='grid gap-6' >
            <SettingsCard title="Create Theme" description='Create your own theme for your own purpose' action={<Link to='/settings/appearance'><Button><ArrowLeft />Go back</Button></Link>} >
                <CreateThemePage />
            </SettingsCard >
        </div >
    )
}

export default Page