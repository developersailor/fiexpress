import { PubSub } from 'graphql-subscriptions';
import { User } from '../../models/User';
import { sign } from 'jsonwebtoken';

export function userResolvers(pubsub: PubSub) {
  return {
    Query: {
      users: async () => {
        return await User.findAll();
      },
      
      user: async (parent: any, { id }: { id: string }) => {
        return await User.findByPk(id);
      },
      
      me: async (parent: any, args: any, context: any) => {
        if (!context.user) {
          throw new Error('Authentication required');
        }
        return context.user;
      }
    },
    
    Mutation: {
      createUser: async (parent: any, { input }: { input: any }, context: any) => {
        try {
          const user = await User.create(input);
          const token = sign({ userId: user.id }, process.env.JWT_SECRET || 'secret');
          
          // Publish subscription
          pubsub.publish('USER_CREATED', {
            userCreated: user
          });
          
          return {
            token,
            user
          };
        } catch (error) {
          throw new Error(`Failed to create user: ${error.message}`);
        }
      },
      
      updateUser: async (parent: any, { id, input }: { id: string, input: any }, context: any) => {
        try {
          const user = await User.findByPk(id);
          if (!user) {
            throw new Error('User not found');
          }
          
          await user.update(input);
          
          // Publish subscription
          pubsub.publish('USER_UPDATED', {
            userUpdated: user
          });
          
          return user;
        } catch (error) {
          throw new Error(`Failed to update user: ${error.message}`);
        }
      },
      
      deleteUser: async (parent: any, { id }: { id: string }, context: any) => {
        try {
          const user = await User.findByPk(id);
          if (!user) {
            throw new Error('User not found');
          }
          
          await user.destroy();
          
          // Publish subscription
          pubsub.publish('USER_DELETED', {
            userDeleted: id
          });
          
          return true;
        } catch (error) {
          throw new Error(`Failed to delete user: ${error.message}`);
        }
      },
      
      login: async (parent: any, { input }: { input: any }, context: any) => {
        try {
          const user = await User.findOne({ where: { email: input.email } });
          if (!user) {
            throw new Error('Invalid credentials');
          }
          
          // In a real app, you'd verify the password here
          const token = sign({ userId: user.id }, process.env.JWT_SECRET || 'secret');
          
          return {
            token,
            user
          };
        } catch (error) {
          throw new Error(`Login failed: ${error.message}`);
        }
      },
      
      logout: async (parent: any, args: any, context: any) => {
        // In a real app, you'd invalidate the token here
        return true;
      }
    },
    
    Subscription: {
      userCreated: {
        subscribe: () => pubsub.asyncIterator(['USER_CREATED'])
      },
      
      userUpdated: {
        subscribe: () => pubsub.asyncIterator(['USER_UPDATED'])
      },
      
      userDeleted: {
        subscribe: () => pubsub.asyncIterator(['USER_DELETED'])
      }
    }
  };
}