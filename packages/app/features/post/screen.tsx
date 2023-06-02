import { createParam } from "solito";

import { View } from "@acme/app/design/layout";
import { Text } from "@acme/app/design/typography";
import { api } from "@acme/app/utils/api";
import { Stack } from "@acme/app/utils/stack";

const { useParam } = createParam();

const Post: React.FC = () => {
  const [id] = useParam("id");
  const { data } = api.post.byId.useQuery(
    { id: id as string },
    { enabled: !!id },
  );

  return (
    <View className="flex-1 bg-[#1F104A]">
      <View className="mx-auto h-full w-full max-w-2xl p-4">
        {data ? (
          <>
            <Stack.Screen options={{ title: data.title }} />
            <Text className="py-2 text-3xl font-bold text-white">
              {data.title}
            </Text>
            <Text className="py-4 text-white">{data.content}</Text>
          </>
        ) : (
          <>
            <Stack.Screen options={{ title: "Loading..." }} />
            <Text className="text-white">Loading...</Text>
          </>
        )}
      </View>
    </View>
  );
};

export default Post;
