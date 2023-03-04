import React from 'react'
import './App.css'
import { Route, Outlet, RouterProvider, createBrowserRouter, createRoutesFromElements } from 'react-router-dom'
import type { LoaderFunctionArgs } from 'react-router-dom'
import { LayoutProps, ListLoaderData, ListDoc } from './interfaces'
import { KeyringProvider } from '@w3ui/react-keyring'

import { Index, Fireproof } from '@fireproof/core'
import { FireproofCtx, useFireproof } from '@fireproof/core/hooks/use-fireproof'
import { useUploader, UploaderCtx } from './hooks/useUploader'
import { makeQueryFunctions } from './makeQueryFunctions'
import loadFixtures from './loadFixtures'

import AppHeader from './components/AppHeader/index.jsx'
import InputArea from './components/InputArea'
import { List } from './components/List'
import { AllLists } from './components/AllLists'

/**
 * A React functional component that renders a list.
 *
 * @returns {JSX.Element}
 *   A React element representing the rendered list.
 */
const LoadingView = (): JSX.Element => {
  return (
    <Layout>
      <div>
        <div className="listNav">
          <button>Loading...</button>
          <label></label>
        </div>
        <section className="main">
          <ul className="todo-list">
            <li>
              <label>&nbsp;</label>
            </li>
            <li>
              <label>&nbsp;</label>
            </li>
            <li>
              <label>&nbsp;</label>
            </li>
          </ul>
        </section>
        <InputArea placeholder="Create a new list or choose one" />
      </div>
      <section className='main'>
        <ul className='todo-list'>
          {lists.map(({ title, _id }, i) => {
            if (_id === '') {
              return (
                <li key={_id || i}>
                  <label>
                    &nbsp;
                  </label>
                </li>
              )
            } else {
              return (
                <li key={_id || i}>
                  <label>
                    <Link to={`/list/${_id}`}>{title}</Link>
                  </label>
                </li>
              )
            }

          })}
        </ul>
      </section>
      <InputArea
      autoFocus = {false}
        onSubmit={onSubmit}
        placeholder='Create a new list or choose one'
      />
      

    </div>
  )
}

interface Doc {
  _id: string
}

interface TodoDoc extends Doc {
  completed: boolean
  title: string
  listId: string
  type: "todo"
}
interface ListDoc extends Doc {
  title: string
  type: "list"
}


interface AppState {
  list: ListDoc,
  todos: TodoDoc[],
  err: Error | null
}

function List() {
  const {
    addTodo,
    toggle,
    destroy,
    clearCompleted,
    updateTitle, database, addSubscriber
  } = useContext(FireproofCtx)
  let { list, todos } = useLoaderData() as ListLoaderData;

  const revalidator = useRevalidator()
  addSubscriber('one List', () => {
    revalidator.revalidate();
  })

  const pathFlag = 'all'
  const uri = window.location.pathname
  const filteredTodos = {
    all: todos,
    active: todos.filter((todo) => !todo.completed),
    completed: todos.filter((todo) => todo.completed)
  }
  const shownTodos = filteredTodos[pathFlag]


  const [editing, setEditing] = useState("")
  const navigate = useNavigate()
  const edit = (todo: TodoDoc) => () => setEditing(todo._id)
  const onClearCompleted = async () => await clearCompleted(list._id)



  return (
    <div>
      <div className='listNav'>
        <button onClick={() => navigate('/')}>Back to all lists</button>
        <label>{list.title}</label>
      </div>
      <ul className='todo-list'>
        {shownTodos.map((todo) => {
          const handle = (fn: (arg0: TodoDoc, arg1: string) => any) => (val: string) => fn(todo, val)
          return (
            <TodoItem
              key={todo._id}
              todo={todo}
              onToggle={handle(toggle)}
              onDestroy={handle(destroy)}
              onSave={handle(updateTitle)}
              onEdit={edit(todo)}
              editing={editing === todo._id}
              onCancel={console.log}
            />
          )
        })}
      </ul>
      <InputArea
            autoFocus = {false}
        onSubmit={async (title: string) =>
          await addTodo(list._id, title)
        }
        placeholder='Add a new item to your list.'

      />

      <Footer
        count={shownTodos.length}
        completedCount={
          filteredTodos['completed'].length
        }
        onClearCompleted={onClearCompleted}
        nowShowing={pathFlag}
        uri={uri && uri.split('/').slice(0, 3).join('/')}
      />
      
    </div>
  )
}


const shortLink = l => `${String(l).slice(0, 4)}..${String(l).slice(-4)}`
const clockLog = new Set<string>()

const TimeTravel = ({ database }) => {
  database.clock && database.clock.length && clockLog.add(database.clock.toString())
  const diplayClocklog = Array.from(clockLog).reverse()
  return (<div className='timeTravel'>
    <h2>Time Travel</h2>
    {/* <p>Copy and paste a <b>Fireproof clock value</b> to your friend to share application state, seperate them with commas to merge state.</p> */}
    {/* <InputArea
      onSubmit={
        async (tex: string) => {
          await database.setClock(tex.split(','))
        }
      }
      placeholder='Copy a CID from below to rollback in time.'
      autoFocus={false}
    /> */}
    <p>Click a <b>Fireproof clock value</b> below to rollback in time.</p>
    <p>Clock log (newest first): </p>
    <ol type={"1"}>
      {diplayClocklog.map((entry) => (
        <li key={entry}>
          <button onClick={async () => {
            await database.setClock([entry])
          }} >{shortLink(entry)}</button>
        </li>
      ))}
    </ol>
  </div>)
}

const NotFound = () => {
  console.log('fixme: rendering missing route screen')
  return (
    <>
      <AppHeader />
      <div>
        <header className='header'>
          <div>
            <div className='listNav'>
              <button>Choose a list.</button>
              <label></label>
            </div>
            <section className='main'>
              <ul className='todo-list'>
                <li><label>&nbsp;</label></li>
                <li><label>&nbsp;</label></li>
                <li><label>&nbsp;</label></li>
              </ul>
            </section>
            <InputArea
            autoFocus = {false}
              placeholder='Create a new list or choose one'
            />
          </div>
        </header>
      </div>
    </>
  )
}

declare global {
  interface Window {
    fireproof: Fireproof
  }
}
const defineIndexes = (database) => {
  database.allLists = new Index(database, function (doc, map) {
    if (doc.type === 'list') map(doc.type, doc)
  })
  database.todosByList = new Index(database, function (doc, map) {
    if (doc.type === 'todo' && doc.listId) {
      map([doc.listId, doc.createdAt], doc)
    }
  })
  window.fireproof = database
  return database
}

/**
 * The root App component
 * @returns {JSX.Element}
 */
function App(): JSX.Element {
  console.log('render App')
  const fp = useFireproof(defineIndexes, loadFixtures)
  const { fetchListWithTodos, fetchAllLists } = makeQueryFunctions(fp)
  const up = useUploader(fp.database) // is required to be in a KeyringProvider
  const listLoader = async ({ params: { listId } }: LoaderFunctionArgs): Promise<ListLoaderData> =>
    await fetchListWithTodos(listId)
  const allListLoader = async ({ params }: LoaderFunctionArgs): Promise<ListDoc[]> => await fetchAllLists()
  function defineRouter(): React.ReactNode {
    return (
      <Route element={<Layout />}>
        <Route path="/" loader={allListLoader} element={<AllLists />} />
        <Route path="list">
          <Route path=":listId" loader={listLoader} element={<List />}>
            <Route path=":filter" element={<List />} />
          </Route>
        </Route>
      </Route>
    )
  }

  const pageBase = document.location.pathname.split('/list')[0] || ''
  return (
    <FireproofCtx.Provider value={fp}>
      <KeyringProvider>
        <UploaderCtx.Provider value={up}>
          <RouterProvider
            router={createBrowserRouter(createRoutesFromElements(defineRouter()), { basename: pageBase })}
            fallbackElement={<LoadingView />}
          />
        </UploaderCtx.Provider>
      </KeyringProvider>
    </FireproofCtx.Provider>
  )
}

export default App
