import React, {
  useCallback,
  useEffect,
  useState,
  FunctionComponent,
  PropsWithChildren,
  useContext,
} from "react"
export type WindowContextProps = {
  clientHeight: number
  clientWidth: number
}

export const useWindowContext = () => {
  return useContext(WindowContext)
}

const WindowContext = React.createContext<WindowContextProps>({
  clientHeight: 0,
  clientWidth: 0,
})
export const WindowContextProvider: FunctionComponent<PropsWithChildren<{ ecart: number }>> = ({
  children,
  ecart,
}) => {
  const getVh = useCallback(() => {
    return Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
  }, [])
  const getVw = useCallback(() => {
    return Math.max(document.documentElement.clientWidth - ecart || 0, window.innerWidth || 0)
  }, [ecart])
  const [clientHeight, setVh] = useState<number>(getVh())
  const [clientWidth, setVw] = useState<number>(getVw())
  useEffect(() => {
    const handleResize = () => {
      //console.log("resize h w", getVh(), getVw())
      setVh(getVh())
      setVw(getVw())
    }
    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [getVh, getVw])
  return (
    <WindowContext.Provider value={{ clientHeight, clientWidth }}>
      {children}
    </WindowContext.Provider>
  )
}
