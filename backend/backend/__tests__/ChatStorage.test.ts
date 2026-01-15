import { describe, it, expect, jest } from '@jest/globals';

// Mock preciso baseado na estrutura real do código
const mockExistingRoom = [{
  id: 'test-room-id',
  participantOneId: 'user1',
  participantTwoId: 'user2',
  bookingId: null,
  isActive: true,
  lastMessage: null,
  lastMessageAt: null
}];

// Mock das funções do DrizzleORM
const mockSelect = jest.fn().mockReturnValue({
  from: jest.fn().mockReturnValue({
    where: jest.fn().mockReturnValue({
      limit: jest.fn().mockResolvedValue(mockExistingRoom)
    })
  })
});

const mockInsert = jest.fn().mockReturnValue({
  values: jest.fn().mockReturnValue({
    returning: jest.fn().mockResolvedValue([{
      id: 'new-room-id',
      participantOneId: 'user1',
      participantTwoId: 'user2',
      bookingId: null,
      isActive: true
    }])
  })
});

jest.mock('../db', () => ({
  db: {
    select: mockSelect,
    insert: mockInsert,
    update: jest.fn(),
    delete: jest.fn()
  }
}));

jest.mock('../shared/schema.ts', () => ({
  chatRooms: {},
  chatMessages: {},
  users: {}
}));

// Importar DEPOIS dos mocks
import { chatStorage } from '../storage/support/ChatStorage';

describe('ChatStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(chatStorage).toBeDefined();
  });

  it('should return boolean for isActive property when room exists', async () => {
    const room = await chatStorage.getOrCreateChatRoom('user1', 'user2');
    
    // ✅ Teste principal: verificar que isActive é boolean
    expect(typeof room.isActive).toBe('boolean');
    expect(room.isActive).toBe(true);
    expect(room.isActive).not.toBeNull();
    expect(room.isActive).not.toBeUndefined();
    
    // ✅ Verificar estrutura do objeto
    expect(room.id).toBe('test-room-id');
    expect(room.fromUserId).toBe('user1');
    expect(room.toUserId).toBe('user2');
  });

  it('should handle null isActive correctly', async () => {
    // Mock com isActive: null para testar a correção ?? false
    mockSelect.mockReturnValueOnce({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([{
            id: 'test-room-null',
            participantOneId: 'user1',
            participantTwoId: 'user2',
            bookingId: null,
            isActive: null, // ✅ Testando o caso null
            lastMessage: null,
            lastMessageAt: null
          }])
        })
      })
    });

    const room = await chatStorage.getOrCreateChatRoom('user1', 'user2');
    
    // ✅ Deve converter null para false
    expect(typeof room.isActive).toBe('boolean');
    expect(room.isActive).toBe(false);
  });
});
