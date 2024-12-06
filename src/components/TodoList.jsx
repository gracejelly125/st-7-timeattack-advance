import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { todoApi } from "../api/todos";

export default function TodoList() {
  const navigate = useNavigate();
  // TODO: 선택: useQuery 를 useTodosQuery 커스텀훅으로 정리해 보세요.
  const {
    data: todos,
    error,
    isPending,
  } = useQuery({
    queryKey: ["todos"],
    queryFn: async () => {
      const response = await todoApi.get("/todos");
      return response.data;
    },
  });

  // TODO: 필수: 아래 handleLike 로 구현되어 있는 부분을 useMutation 으로 리팩터링 해보세요. 모든 기능은 동일하게 동작해야 합니다.
  // TODO: 선택: useMutation 으로 리팩터링 후, useTodoMutation 커스텀훅으로 정리해 보세요.
  const queryClient = useQueryClient();

  useMutation({
    mutationFn: updateTodo,
    onMutate: async(newTodo) => {
      await queryClient.cancelQueries({ queryKey:["todos"]})
      const prevTodos = queryClient.getQueriesData(["todos"])
        queryClient.setQueryData(["todos"], (old) => [...old, newTodo])
        return {prevTodos}
    },
    onError: (error, newTodo, context) => {
      queryClient.setQueriesData(["todos"], context.prevTodos)
      },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"]})
    },
  })

  const { mutate: handleLike } = useMutation({
    mutationFn: async ({id, currentLiked}) => await todoApi.patch(`/todos/${id}`, {
      liked: !currentLiked,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(["todos"])
    }
  })

  if (isPending) {
    return <div style={{ fontSize: 36 }}>로딩중...</div>;
  }

  if (error) {
    console.error(error);
    return (
      <div style={{ fontSize: 24 }}>에러가 발생했습니다: {error.message}</div>
    );
  }

  return (
    <ul style={{ listStyle: "none", width: 250 }}>
      {todos.map((todo) => (
        <li
          key={todo.id}
          style={{
            border: "1px solid black",
            padding: "10px",
            marginBottom: "10px",
          }}
        >
          <h3>{todo.title}</h3>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button onClick={() => navigate(`/detail/${todo.id}`)}>
              내용보기
            </button>
            {todo.liked ? (
              <FaHeart
                onClick={() => handleLike(todo.id, todo.liked)}
                style={{ cursor: "pointer" }}
              />
            ) : (
              <FaRegHeart
                onClick={() => handleLike(todo.id, todo.liked)}
                style={{ cursor: "pointer" }}
              />
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
