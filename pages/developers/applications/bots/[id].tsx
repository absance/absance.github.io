import { NextPage, NextPageContext } from 'next'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import { useState } from 'react'
import useCopyClipboard from 'react-use-clipboard'

import { get } from '@utils/Query'
import { parseCookie, redirectTo } from '@utils/Tools'
import { getToken } from '@utils/Csrf'
import Fetch from '@utils/Fetch'

import { ParsedUrlQuery } from 'querystring'
import { Bot, BotSpec, ResponseProps, Theme } from '@types'

import NotFound from 'pages/404'
import Link from 'next/link'

const Button = dynamic(() => import('@components/Button'))
const DeveloperLayout = dynamic(() => import('@components/DeveloperLayout'))
const DiscordAvatar = dynamic(() => import('@components/DiscordAvatar'))
const Message = dynamic(() => import('@components/Message'))
const Modal = dynamic(() => import('@components/Modal'))

const BotApplication: NextPage<BotApplicationProps> = ({ user, spec, bot, theme, csrfToken }) => {
	const router = useRouter()
	const [ data, setData ] = useState<ResponseProps<unknown>>(null)
	const [ modalOpened, setModalOpen ] = useState(false)
	const [ showToken, setShowToken ] = useState(false)
	const [ tokenCopied, setTokenCopied ] = useCopyClipboard(spec?.token, {
		successDuration: 1000
	})
	// async function updateApplication(d: DeveloperBot) {
	// 	const res = await Fetch(`/applications/bots/${bot.id}`, {
	// 		method: 'PATCH',
	// 		body: JSON.stringify(cleanObject(d))
	// 	})
	// 	setData(res)
	// }

	async function resetToken() {
		const res = await Fetch<{ token: string }>(`/applications/bots/${bot.id}/reset`, {
			method: 'POST',
			body: JSON.stringify({ token: spec.token, _csrf: csrfToken })
		})
		setData(res)

		return res
	}

	if(!user) {
		localStorage.redirectTo = window.location.href
		redirectTo(router, 'login')
		return
	}
	if(!bot || !spec) return <NotFound />
	return <DeveloperLayout enabled='applications'>
		<Link href='/developers/applications'>
			<a className='text-blue-500 hover:text-blue-400'>
				<i className='fas fa-arrow-left' /> ????????????
			</a>
		</Link>
		<h1 className='text-3xl font-bold'>??? ??????</h1>
		<p className='text-gray-400'>?????? ??????????????? ????????? API??? ????????? ????????? ???????????? ???????????? ??? ????????????.</p>
		<div className='lg:flex pt-6'>
			<div className='lg:w-1/5'>
				<DiscordAvatar userID={bot.id} />
			</div>
			<div className='lg:w-4/5 relative'>
				<div className='mt-4'>
					{
						!data ? '' : data.code === 200 ? 
							<Message type='success'>
								<h2 className='text-lg font-black'>?????? ??????!</h2>
								<p>??? ????????? ??????????????????.</p>
							</Message> : <Message type='error'>
								<h2 className='text-lg font-black'>{data.message}</h2>
								<ul className='list-disc list-inside'>
									{
										data.errors?.map((el, i)=> <li key={i}>{el}</li>)
									}
								</ul>
							</Message>
					}
				</div>
				<div className='grid text-left px-6'>
					<h2 className='text-3xl font-bold mb-2 mt-3'>{bot.name}#{bot.tag}</h2>
					<h3 className='text-lg font-semibold'>??? ??????</h3>
					<pre className='text-sm overflow-x-scroll w-full'>{showToken ? spec.token : '******************'}</pre>
					<div className='pt-3 pb-6'>
						<Button onClick={() => setShowToken(!showToken)}>{showToken ? '?????????' : '??????'}</Button>
						<Button onClick={setTokenCopied} className={tokenCopied ? 'bg-green-400 text-white' : null}>{tokenCopied ? '?????????' : '??????'}</Button>
						<Button onClick={()=> setModalOpen(true)}>?????????</Button>
						<Modal isOpen={modalOpened} onClose={() => setModalOpen(false)} dark={theme === 'dark'} header='????????? ????????? ????????????????????????????'>
							<p>????????? ?????????????????? ????????? ??? ?????? ???????????? ??? ????????????</p>
							<div className='text-right pt-6'>
								<Button className='bg-gray-500 text-white hover:opacity-90' onClick={()=> setModalOpen(false)}>??????</Button>
								<Button onClick={async ()=> {
									const res = await resetToken()
									spec.token = res.data.token
									setModalOpen(false)
								}}>?????????</Button>
							</div>
						</Modal>
					</div>
					{/* <Formik validationSchema={DeveloperBotSchema} initialValues={{
						webhook: spec.webhook || '',
						_csrf: csrfToken
					}}
					onSubmit={(data) => updateApplication(data)}>
						{({ errors, touched }) => (
							<Form>
								<div className='mb-2'>
									<h3 className='font-bold mb-1'>?????? URL</h3>
									<p className='text-gray-400 text-sm mb-1'>????????? ???????????? ????????? ?????? ??????????????? ???????????? ?????? ???????????? ???????????? ????????? ??? ????????????.</p>
									<Input name='webhook' placeholder='https://webhook.kbots.link' />
									{touched.webhook && errors.webhook ? <div className='text-red-500 text-xs font-light mt-1'>{errors.webhook}</div> : null}
								</div>
								<Button type='submit'><i className='far fa-save'/> ??????</Button>
							</Form>
						)}
					</Formik> */}
				</div>
			</div>
		</div>
	</DeveloperLayout>

}

interface BotApplicationProps {
  user: string
  spec: BotSpec
	bot: Bot
	csrfToken: string
	theme: Theme
}

export const getServerSideProps = async (ctx: Context) => {
	const parsed = parseCookie(ctx.req)
	const user = await get.Authorization(parsed?.token) || ''
  
	return {
		props: { user, spec: await get.botSpec(ctx.query.id, user), bot: await get.bot.load(ctx.query.id), csrfToken: getToken(ctx.req, ctx.res) }
	}
}

interface Context extends NextPageContext {
  query: URLQuery
}

interface URLQuery extends ParsedUrlQuery {
  id: string
  date: string
}

export default BotApplication