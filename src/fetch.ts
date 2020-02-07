import nodeFetch from 'node-fetch'
import zeitFetch, { Fetch } from '@zeit/fetch'

export default zeitFetch(nodeFetch) as Fetch
