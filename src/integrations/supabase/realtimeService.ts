import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { EventEmitter } from '@/utils/eventEmitter'
import { UserInteractionMessage, ActionType, DispatchProcessStatus } from '@/types/collaborative'


const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

class SupabaseRealtimeService extends EventEmitter {
  private static instance: SupabaseRealtimeService
  private supabase:        SupabaseClient
  private channel:         any // Supabase Realtime channel type
  private localUserId:     string

  private constructor () {
    super()
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    this.channel = this.supabase.channel('daw:messages') // Assuming 'daw' schema and 'messages' channel/table
    this.localUserId = `local-${Math.random().toString(36)
      .substr(2, 9)}`
    this.subscribeToMessages()
  }

  public static getInstance (): SupabaseRealtimeService {
    if (!SupabaseRealtimeService.instance)
      SupabaseRealtimeService.instance = new SupabaseRealtimeService()
    return SupabaseRealtimeService.instance
  }

  public getLocalUserId (): string {
    return this.localUserId
  }

  private subscribeToMessages (): void {
    this.channel
      .on('postgres_changes', { event: 'INSERT', schema: 'daw', table: 'messages' }, (payload: { new: UserInteractionMessage }) => {
        // Handle incoming messages
        const newMessage: UserInteractionMessage = payload.new
        this.emit(newMessage.action, newMessage)
        this.emit('message', newMessage)
      })
      .subscribe()
  }

  public async sendMessage (action: string, params: any, filePayload?: any): Promise<void> {
    const message: UserInteractionMessage = {
      userId:    (await this.supabase.auth.getUser()).data.user?.id || this.localUserId, // Get actual user ID or use local ID
      action:    action as ActionType,
      params,
      timestamp: Date.now(),
      state:     DispatchProcessStatus.SENT, // Initial state
      messageId: `msg-${Date.now()}-${Math.random().toString(36)
        .substring(2, 9)}`,
      filePayload, // Include filePayload if present
    }

    const { error } = await this.supabase
      .from('messages') // Assuming 'messages' is the table name
      .insert([ message ])

    if (error)
      console.error('Error sending message:', error)
  }

  public async getMessageHistory (): Promise<UserInteractionMessage[]> {
    const { data, error } = await this.supabase
      .from('messages')
      .select('*')
      .order('timestamp', { ascending: true })

    if (error) {
      console.error('Error fetching message history:', error)
      return []
    }

    return data as UserInteractionMessage[]
  }

  public async uploadFile (bucketName: string, filePath: string, file: File): Promise<string | null> {
    const { data, error } = await this.supabase.storage
      .from(bucketName)
      .upload(filePath, file)

    if (error) {
      console.error('Error uploading file:', error)
      return null
    }

    // Return the public URL of the uploaded file
    const { data: publicUrlData } = this.supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath)

    return publicUrlData.publicUrl
  }

  public async downloadFile (bucketName: string, filePath: string): Promise<Blob | null> {
    const { data, error } = await this.supabase.storage
      .from(bucketName)
      .download(filePath)

    if (error) {
      console.error('Error downloading file:', error)
      return null
    }

    return data
  }

  // TODO: Implement presence/user tracking if needed

  // TODO: Implement connection status handling and re-subscription
}

export default SupabaseRealtimeService
