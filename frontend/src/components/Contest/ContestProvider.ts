import * as React from "react";

export interface ContestContextData {
	contestId: string
}

export const ContestContext = React.createContext<ContestContextData>({ contestId: null })
