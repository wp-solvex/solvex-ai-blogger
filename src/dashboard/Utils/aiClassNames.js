const aiClassNames = ( ...classes ) => {
	return classes.filter( Boolean ).join( ' ' );
};

export { aiClassNames };
