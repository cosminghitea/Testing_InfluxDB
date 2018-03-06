let string = '';

for (let i = 0; i < 200; i++) {
  if (i !== 199)
    string += `mean("field${i}") AS "mean_field${i}",`
  else
    string += `mean("field${i}") AS "mean_field${i}"`
}

console.log(string);